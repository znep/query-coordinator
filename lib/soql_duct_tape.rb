module SoqlFromConditions

  def self.process(dataset)
    json_query = JsonQueryFromDataset.new(dataset)
    base_query = JsonQueryFromDataset.new(dataset.parent_view)
    SoqlFromJsonQuery.new(json_query, base_query).to_soql
  end

  module Helpers
    def column_for_object(sought_obj, dataset = ds)
      dataset.columns.find do |col|
        sought_obj['columnId'].to_i == col.id ||
        sought_obj['columnFieldName'] == col.fieldName
      end
    end

    def soda2_aggregate(agg)
      {
        'average' => 'avg',
        'minimum' => 'min',
        'maximum' => 'max'
      }[agg.to_s] || agg;
    end
  end

  class JsonQueryFromDataset
    attr_reader :ds
    attr_reader :select, :search, :group, :where, :having, :order

    include Helpers

    def initialize(dataset)
      @ds = dataset
      @group = translate_group_bys ds.query.groupBys
      @where, @having = split_filter_condition_by_grouping(ds.query.filterCondition)
      @order = translate_order_bys ds.query.orderBys
      @search = ds.searchString.try(:dup)
      @select = create_selects_from_group_bys
    end

    def to_hash
      {
        'select' => @select,
        'search' => @search,
        'group' => @group.collect(&:to_hash),
        'where' => @where,
        'having' => @having,
        'order' => @order
      }.delete_if { |k, v| v.blank? }
    end

    class GroupBy
      attr_reader :fieldname, :group_function
      include Comparable

      def self.from_column(column)
        group_obj = GroupBy.new column
        group_obj.group_function = column.format.group_function if column.has_group_function?
        group_obj
      end

      def initialize(column)
        @column = column
        @fieldname = column.fieldName
      end

      def <=>(other)
        fieldname <=> other.fieldname
      end

      def group_function=(function_name)
        group_function_parts = function_name.split('_')
        @group_function =
          if group_function_parts.length > 1
            group_function = []
            if group_function_parts.shift == 'date'
              group_function <<
                case @column.renderTypeName
                  when 'date'; 'datez'
                  when 'calendar_date'; 'date'
                  end
            end
            group_function << 'trunc'
            group_function << group_function_parts.join('_')
            group_function.join('_')
          else
            group_function_parts.shift
          end
      end

      def to_hash
        { 'columnFieldName' => fieldname,
          'groupFunction' => group_function
        }.delete_if { |_, v| v.blank? }
      end
    end

    def translate_group_bys(group_bys)
      return nil if group_bys.blank?

      group_bys.
        compact.
        collect(&method(:column_for_object)).
        collect(&GroupBy.method(:from_column)).
        sort
    end

    def create_selects_from_group_bys
      return nil if @group.blank?

      @group.
        collect(&:fieldname).
        concat(
          ds.columns.
            select(&:is_group_aggregate?).
            collect(&:format).
            collect(&:grouping_aggregate).
            collect(&method(:soda2_aggregate))
        )
    end

    def translate_order_bys(order_bys)
      return nil if order_bys.blank?

      order_bys.collect do |order_by|
        column = column_for_object(order_by['expression'])
        next if column.nil?
        { 'columnFieldName' => column.fieldName,
          'ascending' => order_by['ascending'] }
      end.compact
    end

    def split_filter_condition_by_grouping(fc)
      return [ nil, nil ] if fc.nil?
      return [ translate_subfilter(fc), nil ] unless ds.is_grouped?

      having_cols = (ds.query.groupBys || []).collect(&method(:column_for_object))
      having_cols.concat(ds.columns.
        reject { |col| col.isMeta }.
        select { |col| col.is_group_aggregate? }
      )

      is_having = lambda do |condition|
        return having_cols.include? column_for_object(condition) if condition['type'] == 'column'
        return condition['children'].all?(&is_having) unless condition['children'].blank?
        true # literals
      end

      if fc['value'] == 'AND'
        split_result = fc['children'].inject({}) do |memo, condition|
          type = is_having.call(condition) ? :having : :where
          (memo[type] ||= []) << condition
          memo
        end
        subfilter_wrapper = lambda do |array_of_fcs|
          { 'type' => 'operator',
            'value' => 'AND',
            'children' => array_of_fcs || [] }
        end
        [
          translate_subfilter(subfilter_wrapper.call(split_result[:where])),
          translate_subfilter(subfilter_wrapper.call(split_result[:having]), true)
        ]
      elsif is_having.call(fc)
        [ nil, translate_subfilter(fc, true) ]
      else
        [ translate_subfilter(fc), nil ]
      end
    end

    def translate_subfilter(fc, is_having = false)
      return nil if fc.blank?

      filter_q = { 'operator' => fc['value'] }
      case filter_q['operator']
      when 'AND', 'OR'
        filter_q['children'] =
          fc['children'].collect { |child| translate_subfilter(child, is_having) }
      else
        fc['children'].each do |child|
          case child['type']
          when 'column'
            column = column_for_object(child)
            filter_q['columnFieldName'] = child['columnFieldName'] || column.fieldName
            if is_having && column.is_grouping_aggregate?
              aggregate_prefix = soda2_aggregate(column.format.grouping_aggregate)

              filter_q['columnFieldName'] = "#{aggregate_prefix}_#{filter_q['columnFieldName']}"
            end
          when 'literal'
            if filter_q['value'].nil?
              filter_q['value'] = child['value']
            else
              (filter_q['value'] = Array(filter_q['value'])) << child['value']
            end
          end
        end
      end
      filter_q
    end
  end

  class SoqlFromJsonQuery
    attr_reader :ds, :base

    include Helpers

    def initialize(json_query, base_query = nil)
      @json_query = json_query
      @ds = json_query.ds
      @base = @ds.parent_view || @ds
      @base_query = base_query || ds.parent_view.try(:metadata).try(:json_query) || Hashie::Mash.new
      @select = []

      @search = process_search_string json_query.search
      @order_bys = process_order_bys json_query.order

      if base_query_is_different_and_has_groups? && json_query.where.present?
        @where = self_and_base.
          collect(&:where).
          collect(&method(:process_filter_clause)).
          reject(&:blank?).
          collect(&method(:wrap_in_parentheses)).
          compact.
          join(' and ')
      end

      if json_query.having.present?
        @having = self_and_base.
          collect(&:having).
          collect(&method(:process_filter_clause)).
          reject(&:blank?).
          collect(&method(:wrap_in_parentheses)).
          compact.
          join(' and ')
      end

      if base_query_is_different_and_has_groups?
        @group_bys = process_group_bys json_query.group
      end
    end

    # Effectively equivalent to `to_soql_parts.to_query`. Spelling it out for now.
    # #to_query escapes the result, whereas this does not. Not sure which is needed.
    def to_soql
      to_soql_parts.inject([]) do |soql, part|
        key, value = part
        soql << "#{key}=#{value}" unless value.blank?
        soql
      end.join('&')
    end

    def to_soql_parts
      select = @select.empty? ? nil : @select.join(',')

      {
        '$group' => @group_bys,
        '$order' => @order_bys,
        '$search' => @search,
        '$select' => select,
        '$where' => @where,
        '$having' => @having
      }.delete_if { |_, v| v.blank? }
    end

    def base_is_self?
      @base.id == @ds.id
    end

    def base_query_is_different_and_has_groups?
      has_base_groups = @base_query.group.present?
      !has_base_groups || (base_is_self? && has_base_groups)
    end

    def self_and_base
      @self_and_base ||=
        begin
          queries = [ @json_query ]
          queries << @base_query unless base_is_self?
          queries
        end
    end

    def process_search_string(search_string)
      @base_query.search == search_string ? '' : search_string
    end

    def process_order_bys(order_bys)
      return nil if order_bys.nil?

      order_bys.collect do |order_by|
        column = column_from_dataset(order_by)
        column = translate_column_to_query_base(column)

        next if column.nil?
        order = if column.is_group_aggregate?
                  as_function(column.format.grouping_aggregate, column.fieldName)
                else
                  column.fieldName
                end
        order += ' desc' unless order_by['ascending']
        order
      end.compact.join(',')
    end

    def process_group_bys(group_bys)
      return nil if group_bys.nil?

      group_bys.collect do |group_by|
        group_by = group_by.to_hash
        column = column_from_dataset(group_by)
        column = translate_column_to_query_base(column)

        next if column.nil?
        if group_by['groupFunction']
          select_as = "#{column.fieldName}__#{group_by['groupFunction']}"
          @select << "#{as_function(group_by['groupFunction'], column.fieldName)} as #{select_as}"
          select_as
        else
          column.fieldName
        end
      end.compact.join(',')
    end

    def process_filter_clause(fc)
      return nil if fc.nil?

      case fc['operator'].upcase
      when 'AND', 'OR'
        fc['children'].map(&method(:process_filter_clause)).
                       collect(&method(:wrap_in_parentheses)).
                       join(" #{fc['operator']} ")
      when 'EQUALS', 'NOT_EQUALS', 'LESS_THAN', 'GREATER_THAN',
           'LESS_THAN_OR_EQUALS', 'GREATER_THAN_OR_EQUALS'
        column = extract_column(fc)
        value = extract_value(fc, column.renderTypeName)
        wrapper = method(column.is_text? ? :to_upper : :identity)

        fieldname = wrap_fieldname_for_soql(column)
        [fieldname, value].collect(&wrapper).join(operator(fc['operator']))
      when 'IS_BLANK', 'IS_NOT_BLANK'
        column = extract_column(fc)
        if column.renderTypeName == 'checkbox'
          # this might not be necessary; the standard null check also seems to work
          checkbox_soql = {
            'IS_BLANK' => "not #{column.fieldName}",
            'IS_NOT_BLANK' => column.fieldName
          }
          checkbox_soql[fc['operator'].upcase]
        else
          operator = fc['operator'].downcase.sub(/_blank/, '').gsub('_', ' ')
          "#{column.fieldName} #{operator} null"
        end
      when 'BETWEEN'
        column = extract_column(fc)
        values = extract_value(fc, column.renderTypeName)
        wrapper = method(column.is_text? ? :to_upper : :identity)
        [ [column.fieldName, values[0]].collect(&wrapper).join('>='),
          [column.fieldName, values[1]].collect(&wrapper).join('<=')
        ].join(' AND ')
      when 'STARTS_WITH', 'CONTAINS', 'NOT_CONTAINS'
        column = extract_column(fc)
        op = case fc['operator'].upcase
             when 'NOT_CONTAINS'
               'not contains'
             else
               fc['operator'].downcase
             end
        value = extract_value(fc, column.renderTypeName)
        wrapper = method(column.is_text? ? :to_upper : :identity)
        as_function(op, [column.fieldName, value].compact.collect(&wrapper).join(','))
      end
    end

    SIMPLE_OPERATORS = {
      'EQUALS' => '=',
      'NOT_EQUALS' => '!=',
      'LESS_THAN' => '<',
      'GREATER_THAN' => '>',
      'LESS_THAN_OR_EQUALS' => '<=',
      'GREATER_THAN_OR_EQUALS' => '>='
    }

    NUMERIC_TYPES = %r{
      (number)
      |(money)
      |(percent)
      |(stars)
    }x

    private

    # Not 100% sure this is necessary, since SoQL only cares about fieldNames.
    # However, since I'm not 100% sure it's *not* necessary...
    def translate_column_to_query_base(derived_column)
      return derived_column if base_is_self?
      @base.columns.find do |col|
        derived_column.fieldName == col.fieldName
      end
    end
    def operator(op)
      SIMPLE_OPERATORS[op.upcase]
    end

    def wrap_fieldname_for_soql(column)
      case column.renderTypeName
      when 'stars'
        as_function('to_number', column.fieldName)
      else
        column.fieldName
      end
    end

    def extract_column(fc)
      #column_condition = fc['children'].detect { |c| c['type'] == 'column' }
      #column_for_object(column_condition) unless column_condition.nil?
      column_from_dataset(fc)
    end

    def extract_value(fc, column_type)
      #value_conditions = fc['children'].select { |c| c['type'] != 'column' }
      #value = value_conditions.collect { |condition| condition.try(:[], 'value') }
      #value = value.first if value.length == 1
      value = fc['value']

      wrapper = case column_type
                when 'date'
                  method(:as_date)
                when 'money'
                  method(:as_function).to_proc.curry.call('to_usd')
                when NUMERIC_TYPES
                  method(:identity)
                else
                  method(:wrap_string_in_single_quotes)
                end
      case value
        when Array
          value.collect(&wrapper)
        else
          wrapper.call value
        end
    end

    def column_from_dataset(sought_obj)
      column_for_object(sought_obj, @ds)
    end

    def column_from_base(sought_obj)
      column_for_object(sought_obj, @base)
    end

    def as_function(function_name, x)
      "#{function_name}#{wrap_in_parentheses(x)}"
    end

    def wrap_in_parentheses(x)
      "(#{x})"
    end

    def wrap_string_in_single_quotes(x)
      case x
      when String
        "'#{x}'"
      else
        x
      end
    end

    # Not sure what time zone I should be using, so leaving in the code for multiple ones.
    # Javascript uses the browser's time zone, which we don't have, so I'm going to default to UTC.
    # Manually parsing because DateTime.strptime doesn't seem to work? :(
    def as_date(x)
      month, day, year = x.split('/').collect(&:to_i)
      #iso8601 = Date.new(year, month, day).iso8601 # This seems like the safer option.
      iso8601 = DateTime.new(year, month, day, 0, 0, 0).iso8601
      #iso8601.slice! iso8601.index('+')..-1 # Remove the time zone entirely for "local" time.
      iso8601.sub!('+00:00', 'Z') # Use UTC; this is sort of what the JS does.
      wrap_string_in_single_quotes(iso8601)
    end

    def to_upper(x)
      as_function('UPPER', x)
    end

    def identity(x)
      x
    end
  end
end
