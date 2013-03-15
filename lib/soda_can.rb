#
# SodaCan performs simple filtering atop precached
# row data.
# SodaCan does NOT Support:
#    - functions
#    - group-by
#    - nested_tables
#    - within_circle or any geo operations except equals, not_equals
#
class SodaCan
  ROW_META_LAST_INDX = 7.freeze

  STRING_OPS = %w(equals not_equals is_not_blank is_blank contains starts_with greater_than less_than greater_than_or_equals less_than_or_equals).freeze
  NUMERIC_OPS = %w(equals not_equals is_not_blank is_blank greater_than less_than greater_than_or_equals less_than_or_equals).freeze
  EQUALITY_OPS = %w(equals not_equals is_not_blank is_blank).freeze
  ALL_OPS = STRING_OPS + NUMERIC_OPS + EQUALITY_OPS

  # Datatype => { :ops => ALLOWED OPERATIONS, :expect => EXPECTED_CLASS(ES),
  #               :convert => FUNCTION_ON_EXPECTED_CLASS_TO_COERCE}, :convert_fn => APPLIED FN TO COERSE
  TYPES = {
      "text" =>           {:ops => STRING_OPS,    :expect => "String,NilClass", :convert_fn => :nil_string},
      "number" =>         { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "money" =>          { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "percent" =>        { :ops => NUMERIC_OPS,  :expect => "String,Float,Integer,NilClass", :convert => :to_f },
      "calendar_date" =>  { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "email" =>          { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "checkbox" =>       { :ops => EQUALITY_OPS, :expect => "TrueClass,FalseClass", :convert => nil},
      "flag" =>           { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "stars" =>          { :ops => NUMERIC_OPS,  :expect => "String,Fixnum,NilClass", :convert => :to_i },
      "drop_down_list" => { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "location" =>       { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json},
      "html" =>           { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "dataset_link" =>   { :ops => STRING_OPS,   :expect => "String,NilClass", :convert_fn => :nil_string},
      "date" =>           { :ops => NUMERIC_OPS,  :expect => "String,Integer,Fixnum,NilClass", :convert => :to_i},
      "url" =>            { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json},
      "phone" =>          { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json},
      "photo" =>          { :ops => EQUALITY_OPS, :expect => "String,NilClass", :convert_fn => :nil_string},
      "document" =>       { :ops => EQUALITY_OPS, :expect => "Hash", :convert => :to_json},
  }.freeze

  #
  # SodaCan is fairly liberal with the input format of rows; it can
  # be either rows as an Array, or Hash by id or fieldName. If hashing
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
      soda_can?(conditions['filterCondition'], positive_cb = method(:validate_op)) && validate_order_by(conditions['orderBys'])
    ensure
      log_metrics("can_query_ms", (Time.now - start) * 1000)
    end
  end

  def get_rows(conditions, per_page = 1024, page = 1)
    start = Time.now
    begin
      log_metrics("num_calls", 1)
      if conditions.nil?
        return @rows[:rows]
      end
      filtered = @rows[:rows].select { |r|
        soda_can?(conditions['filterCondition'], positive_cb = method(:perform_op), r)
      }
      row_start = per_page * (page - 1)
      row_end = row_start + per_page - 1
      ordered = order_rows(filtered, conditions['orderBys'])[row_start..row_end]
      log_metrics("num_results", ordered.length)
      ordered
    ensure
      log_metrics("get_rows_ms", (Time.now - start) * 1000)
    end
  end

  def meta
    @rows.nil? ? nil : @rows['meta']
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

  def validate_order_by(order_bys)
    return true if order_bys.nil?
    order_bys.each do |o|
      field = o["expression"]["fieldName"] || fail("Order by only supports fieldName references", o)
      resolve_field_type(field, nil) || fail("Unable to resolve field type for #{field} in order-by", o)
    end
  end

  #
  # Order rows using order_bys
  #   - only supports references by fieldName
  #
  def order_rows(rows, order_bys)
    return rows if order_bys.nil? || order_bys.size <= 0
    rows.sort do |a, b|
      i, res = 0, 0
      div = 1
      begin
        field = order_bys[i]["expression"]["fieldName"] || fail("Order by only supports fieldName references", order_bys[i], true)
        type = resolve_field_type(field, nil) || fail("Unable to resolve field type for #{field} in order-by", order_bys[i], true)
        res += ( (coerce_type(a[field],type) <=> coerce_type(b[field],type)) * (!order_bys[i]["ascending"] ? -1.0 : 1.0 )) / div
        div *= 10.0
      end until (i+=1) == order_bys.size
      res <=> 0
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
          type = resolve_column_type(c)
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

  def metrics
    @metrics ||= {}
    unless @metrics["get_rows_ms"].nil? || @metrics["can_query_ms"].nil?
      log_metrics("can_query_ave", @metrics["can_query_ms"] / @metrics["num_validates"], false)
      log_metrics("get_rows_ave", @metrics["get_rows_ms"] / @metrics["num_calls"], false)
    end
    @metrics
  end

  def fail(msg, context = nil, throw_exception=false)
    hint = { :error => msg, :context => context }
    @hints[hints.to_json.sum] = hint
    log_metrics("#{throw_exception ? "hard" : "soft"}_failure", 1)
    return false unless throw_exception
    raise Exception, msg
  end

  def hints
    @hints
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
      val = resolve_value(c, row)
      val_clazz = val.class.name
      # if we have previously set clazz to non-nil; fail if this type does not match
      unless clazz.nil? || val.nil? || clazz == val_clazz
        fail("Operand classes do not match #{clazz} vs #{val_clazz}", children, true)
      end
      case c['type']
        when "column"
          # for c
          type = resolve_column_type(c)
          fail("Unable to extract type from child #{c.to_json}, operator #{operator}", children, true) if type.nil?
          if !TYPES.include?(type) || !TYPES[type][:ops].include?(op)
            fail("Unsupported Operation #{op} on type #{type} - query not validated before processing!", children, true)
          end
          clazz = val_clazz
        when "literal"
            uncoerced_literals = true
      end
      val
    end
    # Now we know the type; let's coerce those literals
    if uncoerced_literals
      operands = operands.map do |o|
        if !o.nil? && o.class.name != clazz
          coerce_type(o, type)
        else
          o
        end
      end
    end

    send(op, operands)
  end

  #
  # Resolve the column type from a single child; return nil
  # if the child references a literal
  #
  def resolve_column_type(atom)
    if  atom['type'].to_s.downcase  == "column"
      field = atom['columnFieldName']
      columnId = atom['columnId']
      resolve_field_type(field, columnId)
    else
      nil
    end
  end

  # Extract the expected field type from the metadata
  def resolve_field_type(fieldName, columnId)
    @metadata['columns'].each { |c|
      if !fieldName.nil? && c['fieldName'] == fieldName || !columnId.nil? && c['id'] == columnId
        return c['dataTypeName']
      end
    }
    nil
  end

  #
  # Resolve the value from a single child from the row or
  # literal.
  #
  # TODO: Handle special types; such as urls/documents here
  #
  def resolve_value(atom, row)
    case atom['type'].to_s.downcase
      when "column"
        return nil if row.nil?
        field = atom['columnFieldName']
        columnId = atom['columnId']
        type = resolve_column_type(atom)
        return nil if type.nil?
        # Check if rows as hashes
        if row.class == Hash
          if field.nil? && columnId.nil?
            fail("field name and columnId are not available", atom, true)
          end
          key = get_row_hash_key(field, columnId)
          value = row[key]
          return nil if value.nil?
          return coerce_type(row[key], type)
        else
          # Otherwise lookup by field index
          field_index = get_field_index(field, columnId)
          return coerce_type(row[field_index], type)
        end
      when "literal"
        return atom['value']
      else
        fail("Unsupported value type! #{atom['type']}", atom, true)
      end
  end

  def get_row_hash_key(field, columnId)
    if @hash_by_ids
      columnId.nil? ? get_id_by_field(field).to_s : columnId
    else
      field.nil? ? get_field_by_id(columnId) : field
    end
  end

  #
  # Get the columnId by the field name
  #
  def get_id_by_field(field)
    fail("No metadata available", nil, true) if @metadata.nil?
    @metadata['columns'].each { |c|
      if c['fieldName'] == field
        return c['id']
      end
    }
    fail("No field name for columnId #{col_id}", nil, true)
  end

  #
  # Get the field name by the column id
  #
  def get_field_by_id(col_id)
    fail("No metadata available", nil, true) if @metadata.nil?
    @metadata['columns'].each { |c|
      if c['id'] == col_id
        return c['fieldName']
      end
    }
    fail("No field name for columnId #{col_id}", nil, true)
  end

  #
  # For row data which is not organized into a hash; find
  # the index of the value within the row array
  #
  def get_field_index(field, col_id)
    fail("No metadata for field #{field} col_id #{col_id}", nil, true) if @metadata.nil?
    @metadata['columns'].each { |c|
      if !field.nil? && c['fieldName'] == field || !col_id.nil? && c['id'] == col_id
        idx = c['position'].to_i + ROW_META_LAST_INDX
        @field_map[field] = idx
        return idx
      end
    }
    fail("Invalid field name #{field} or columnId #{col_id}", [field, col_id], true)
  end

  def coerce_type(value, type)
    if TYPES[type].nil?
      fail("Unknown type, #{type} with value #{value}", nil, true)
    end
    unless expected_type?(value, type)
      fail("Unexpected type for type #{type}, value #{value} got: #{value.class.name} expected: #{TYPES[type][:expect]}", nil, true)
    end
    return value.send(TYPES[type][:convert]) unless TYPES[type][:convert].nil?
    return method(TYPES[type][:convert_fn]).call(value) unless TYPES[type][:convert_fn].nil?
    value
  end

  def expected_type?(value, type)
    TYPES[type][:expect].split(',').include? value.class.name
  end

  def nil_string(val)
    val.nil? ? "" : val
  end

  def not_equals(operands)
    !equals(operands)
  end

  def equals(operands)
    operands.size == 2 or fail("Invalid number of operands for equals, expected 2, got #{operands.size} => #{operands}", operands, true)
    !operands[0].nil? && !operands[1].nil? && operands[0] == operands[1]
  end

  def is_not_blank(operands)
    !is_blank(operands)
  end

  def is_blank(operands)
    operands.size == 1 or fail("Invalid number of operands for is_blank, expected 1, got #{operands.size} => #{operands}", operands, true)
    operands[0].nil? || operands[0].class == String && operands[0].empty?
  end

  def less_than(operands)
    operands.size == 2 or fail("Invalid number of operands for less_than, expected 2, got #{operands.size} => #{operands}", operands, true)
    !operands[0].nil? && !operands[1].nil? && operands[0] < operands[1]
  end

  def greater_than(operands)
    operands.size == 2 or fail("Invalid number of operands for greater_than, expected 2, got #{operands.size} => #{operands}", operands, true)
    !operands[0].nil? && !operands[1].nil? && operands[0] > operands[1]
  end

  def contains(operands)
    operands.size == 2 or fail("Invalid number of operands for contains, expected 2, got #{operands.size} => #{operands}", operands, true)
    !operands[0].nil? && !operands[1].nil? &&operands[0].include?(operands[1])
  end

  def starts_with(operands)
    operands.size == 2 or fail("Invalid number of operands for starts_with, expected 2, got #{operands.size} => #{operands}", operands, true)
    !operands[0].nil? && operands[0].starts_with?(operands[1])
  end

  def greater_than_or_equals(operands)
    return equals(operands) || greater_than(operands)
  end

  def less_than_or_equals(operands)
    return equals(operands) || less_than(operands)
  end

end