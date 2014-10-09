require 'sodacan/util'
require 'sodacan/order'
require 'sodacan/index'

#
# SodaCan performs simple filtering atop precached
# row data.
# SodaCan does NOT Support:
#    - functions
#    - group-by
#    - nested_tables
#    - within_circle or any geo operations except equals, not_equals
#
module SodaCan
  STRING_OPS = %w(equals not_equals is_not_blank is_blank contains starts_with greater_than less_than greater_than_or_equals less_than_or_equals).freeze
  NUMERIC_OPS = %w(equals not_equals is_not_blank is_blank greater_than less_than greater_than_or_equals less_than_or_equals).freeze
  EQUALITY_OPS = %w(equals not_equals is_not_blank is_blank).freeze
  ALL_OPS = STRING_OPS + NUMERIC_OPS + EQUALITY_OPS

  # Datatype => { :ops => ALLOWED OPERATIONS, :expect => EXPECTED_CLASS(ES),
  #               :convert => FUNCTION_ON_EXPECTED_CLASS_TO_COERCE}, :convert_fn => APPLIED FN TO COERSE
  TYPES = {
      "text" =>           { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "number" =>         { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "money" =>          { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "percent" =>        { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "calendar_date" =>  { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "email" =>          { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "checkbox" =>       { :ops => EQUALITY_OPS, :expect => "TrueClass,FalseClass", :convert => nil },
      "flag" =>           { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "stars" =>          { :ops => NUMERIC_OPS,  :expect => "String,Fixnum,NilClass", :convert => :to_i },
      "drop_down_list" => { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "location" =>       { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json },
      "html" =>           { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "dataset_link" =>   { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string },
      "date" =>           { :ops => NUMERIC_OPS,  :expect => "String,Integer,Fixnum,NilClass", :convert => :to_i },
      "url" =>            { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json },
      "phone" =>          { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json },
      "photo" =>          { :ops => EQUALITY_OPS, :expect => "String,NilClass", :convert_fn => :nil_string },
      "document" =>       { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json },
  }.freeze

class Processor

  #
  # SodaCan is fairly liberal with the input format of rows; it can
  # be either rows as an Hash by id or fieldName. If hashing
  # by ids, you must set hash_by_ids to true.
  #
  def initialize(metadata, rows, hash_by_ids = false)
    @hints = {}
    @metadata = metadata
    @field_map = {}
    @field_types = {}
    @rows = {}
    # Inspect rows and normalize the object rows
    if rows.class == Array
        @rows[:rows] = rows
    end

    if rows && rows.class == Hash
      if rows['entries']
        @rows[:rows] = rows['entries']
      end
      if rows['data']
        @rows[:rows] = rows['data']
      end
      if rows[:rows]
        @rows = rows
      end
      @metadata ||= rows[:meta]
    end
    @hash_by_ids = hash_by_ids
    @entries_key = :rows
    if @metadata['columns'].nil? && !@metadata['view'].nil?
      @metadata = @metadata['view']
    end
    @index = SodaCan::Index.new(@metadata)
    log_metrics("cache_size", @rows[:rows].nil? ? 0 : @rows[:rows].length) unless @rows.nil?
  end

  def total_rows
    unless @metadata.nil?
      @metadata['meta']['totalRows']
    else
      nil
    end
  end

  def can_query?(conditions)
    start = Time.now
    begin
      log_metrics("num_validates", 1)
      return false if @rows.nil?
      if conditions.nil?
        return true
      end
      return false unless conditions['groupBys'].nil?
      valid = soda_can?(conditions['filterCondition'], positive_cb = method(:validate_and_index_op)) && Order.validate_order_by(conditions['orderBys'], @metadata)
      @index.update_index(@rows[:rows], @hash_by_ids) if valid
      valid
    ensure
      log_metrics("can_query_ms", (Time.now - start) * 1000)
    end
  end

  def get_rows(conditions, per_page = 1024, page = 1)
    start = Time.now
    begin
      @hints[:explain] = []
      log_metrics("num_calls", 1)
      if conditions.nil? || conditions.empty?
        ordered = @rows[:rows]
      else
        filtered = all_rows = @rows[:rows]
        unless conditions['filterCondition'].nil?
          row_indicies, partial_seq_scan, full_seq_scan = @index.index_scan(conditions['filterCondition'])
          row_slice = full_seq_scan ? all_rows : row_indicies.size > 0 ? get_row_slice(all_rows, row_indicies) : []
          requires_seq_scan = partial_seq_scan || full_seq_scan
          explain("index scan full_req #{full_seq_scan} partial_req #{partial_seq_scan}", all_rows.size, row_slice.size)
          filtered = requires_seq_scan ? sequential_scan(row_slice, conditions['filterCondition']) : row_slice
          explain("seq scan", row_slice.size, filtered.size) if requires_seq_scan
        end
        ordered = Order.order_rows(filtered, conditions['orderBys'], @metadata, @hash_by_ids) || []
      end
      row_start = per_page * (page - 1)
      row_end = row_start + per_page - 1
      ordered = ordered[row_start..row_end]
      log_metrics("num_results", ordered.size)
      ordered
    ensure
      log_metrics("get_rows_ms", (Time.now - start) * 1000)
    end
  end

  def get_row_slice(all_rows, indices)
    slice = []
    indices.each { |i|
      slice << all_rows[i]
    }
    slice
  end

  def meta
    @metadata
  end

  def metrics
    @metrics ||= {}
    unless @metrics["get_rows_ms"].nil? || @metrics["can_query_ms"].nil?
      log_metrics("can_query_ave", @metrics["can_query_ms"] / @metrics["num_validates"], false)
      log_metrics("get_rows_ave", @metrics["get_rows_ms"] / @metrics["num_calls"], false)
    end
    @metrics
  end

  def explain(msg, rows_in, rows_out)
    @hints[:explain] ||= []
    @hints[:explain] << {:rows_in => rows_in, :rows_out => rows_out, :msg => msg}
  end

  def hints
    @hints[:indexer] = @index.hints
    @hints
  end

  protected

  def validate_and_index_op(operator, children, row)
    return false unless validate_op(operator, children, nil)
    @index.register_fields_to_index_op(operator, children, nil)
  end

  def sequential_scan(rows, filter_conditions)
    rows.select { |r|
      soda_can?(filter_conditions, positive_cb = method(:perform_op), r)
    }
  end

  #
  # SODA1 Tree Walker; applying positive_cb when a supported operation is encountered
  #
  def soda_can?(part, positive_cb = -> a,n,r {true}, row = {})
    if part.nil? || part['type'].nil?
      return true
    end
    if part['type'].to_s.downcase != "operator"
      return true
    end
    operator = part['value'].to_s.downcase

    if ALL_OPS.include?(operator)
      positive_cb.call(operator, part['children'], row)
      #return fail("Processing operator #{operator} failed", part) if !result
    else
      case operator
        when "and"
          part['children'].each do |c|
            soda_can?(c, positive_cb, row) or return false
          end
        when "or"
          part['children'].each do |c|
            return true if soda_can?(c, positive_cb, row)
          end
        else
          return fail("#{operator} not supported; we only support and/or", part)
      end
    end
  end

  #
  # Validate the type of referenced columns against the list of
  # supported operations. Children is the array of children of
  # one of the basic operations, eg. equals, greater_than, etc.
  #
  def validate_op(operator, children, row_unused)
    return fail("Operator #{operator} not supported", children) unless ALL_OPS.include?(operator)
    value_class = nil
    children.each do |c|
        # We cannot check literals properly
        if c['type'] == "literal"
          next
        end

        # column references are checked against any other references in the query
        if c['type'] == "column"
          type = Util.resolve_column_type(c, @metadata)
          if type.nil? || !TYPES.include?(type)
            return fail("Column type #{type} not supported", c)
          end
          return fail("Column type #{type} does not support operator #{operator}", c) if !TYPES[type][:ops].include?(operator)

          # If we have previously found a column type in this operation, value_class will be set to the
          # the expected class of that column. Subsequent column references are checked against this.
          current_value_class = TYPES[type][:expect]
          if !value_class.nil? && value_class != current_value_class
            return fail("Column type class, #{current_value_class} does not match previous column value class #{value_class}", c)
          end
          value_class = current_value_class
        end
    end
    return true
  end

  def log_metrics(name, value, aggregate=true)
    @metrics ||= {}
    last_val = @metrics[name].nil? ? 0 : @metrics[name]
    @metrics[name] = aggregate ? last_val + value : value
  end

  def fail(msg, context = nil, throw_exception=false)
    hint = { :error => msg, :context => context }
    @hints[hints.to_json.sum] = hint
    log_metrics("#{throw_exception ? "hard" : "soft"}_failure", 1)
    return false unless throw_exception
    raise Exception, msg + context.to_json
  end

  #
  # Perform an operation at the leaf of a query, e.g. EQUALS, etc. By this time
  # the tree should be validated; but we throw exceptions if it is not.
  #
  def perform_op(operator, children, row)
    op = operator.downcase
    fail("Unsupported Operation #{op}", children, true) unless ALL_OPS.include?(op)
    clazz = nil
    type = nil
    uncoerced_literals = false
    operands = children.map do |c|
      val = Util.resolve_value(c, row, @metadata, @hash_by_ids)
      # if we have previously set clazz to non-nil; fail if this type does not match
      case c['type']
        when "column"
          # for c
          type = Util.resolve_column_type(c, @metadata)
          fail("Unable to extract type from child #{c.to_json}, operator #{operator}", children, true) if type.nil?
          if !TYPES.include?(type) || !TYPES[type][:ops].include?(op)
            fail("Unsupported Operation #{op} on type #{type} - query not validated before processing!", children, true)
          end
          clazz = val.class.name
        when "literal"
          uncoerced_literals = true
      end
      val
    end
    # Now we know the type; let's coerce those literals
    if uncoerced_literals
      operands = operands.map do |o|
        if !o.nil? && o.class.name != clazz
          Util.coerce_type(o, type)
        else
          o
        end
      end
    end

    Util.send(op, operands)
  end

end
end
