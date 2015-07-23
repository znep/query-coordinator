module SodaCan
  class Util

    def self.fail(msg, context = nil, throw_exception=false)
      err = "#{msg} context: #{context.inspect}"
      Rails.logger.error(err)
      return false unless throw_exception
      raise Exception, err
    end

    #
    # Resolve the column type from a single child; return nil
    # if the child references a literal
    #
    def self.resolve_column_type(atom, metadata)
      if  atom['type'].to_s.downcase  == "column"
        field = atom['columnFieldName']
        column_id = atom['columnId']
        resolve_field_type(field, column_id, metadata)
      else
        nil
      end
    end

    # Extract the expected field type from the metadata
    def self.resolve_field_type(fieldName, columnId, metadata)
      metadata['columns'].each { |c|
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
    def self.resolve_value(atom, row, metadata, hash_by_ids)
      case atom['type'].to_s.downcase
        when "column"
          return nil if row.nil?
          field = atom['columnFieldName']
          columnId = atom['columnId']
          type = resolve_column_type(atom, metadata)
          return nil if type.nil?
          # Check if rows as hashes
          if row.class == Hash
            if field.nil? && columnId.nil?
              fail("field name and columnId are not available", atom, true)
            end
            key = Util.get_row_hash_key(field, columnId, metadata, hash_by_ids)
            value = row[key]
            return nil if value.nil?
            return coerce_type(value, type)
          else
            fail("Only rows indexed by hash are supported", row, true)
          end
        when "literal"
          return atom['value']
        else
          fail("Unsupported value type! #{atom['type']}", atom, true)
      end
    end

    def self.resolve_column_value(row, type, field, columnId, metadata, hash_by_ids)
     # Check if rows as hashes
      if row.class == Hash
        if field.nil? && columnId.nil?
          fail("field name and columnId are not available", atom, true)
        end
        key = Util.get_row_hash_key(field, columnId, metadata, hash_by_ids)
        value = row[key]
        return nil if value.nil?
        Util.coerce_type(value, type)
      else
        fail("Only rows organized into Hash are supported", row, true)
      end
    end

    def self.get_row_hash_key(field, columnId, metadata, hash_by_ids)
      if hash_by_ids
        columnId.nil? ? get_id_by_field(field, metadata).to_s : columnId
      else
        field.nil? ? get_field_by_id(columnId, metadata) : field
      end
    end

    #
    # Get the columnId by the field name
    #
    def self.get_id_by_field(field, metadata)
      fail("No metadata available", nil, true) if metadata.nil?
      metadata['columns'].each { |c|
        if c['fieldName'] == field
          return c['id']
        end
      }
      fail("No field name for columnId #{col_id}", nil, true)
    end

    #
    # Get the field name by the column id
    #
    def self.get_field_by_id(col_id, metadata)
      fail("No metadata available", nil, true) if metadata.nil?
      metadata['columns'].each { |c|
        if c['id'] == col_id
          return c['fieldName']
        end
      }
      fail("No field name for columnId #{col_id}", nil, true)
    end

    def self.coerce_type(value, type)
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

    def self.expected_type?(value, type)
      TYPES[type][:expect].split(',').include? value.class.name
    end

    def self.nil_string(val)
      val.nil? ? "" : val
    end

    def self.not_equals(operands)
      !equals(operands)
    end

    def self.equals(operands)
      operands.size == 2 or fail("Invalid number of operands for equals, expected 2, got #{operands.size} => #{operands}", operands, true)
      !operands[0].nil? && !operands[1].nil? && operands[0] == operands[1]
    end

    def self.is_not_blank(operands)
      !is_blank(operands)
    end

    def self.is_blank(operands)
      operands.size == 1 or fail("Invalid number of operands for is_blank, expected 1, got #{operands.size} => #{operands}", operands, true)
      operands[0].nil? || operands[0].class == FalseClass || operands[0].class == String && operands[0].empty?
    end

    def self.less_than(operands)
      operands.size == 2 or fail("Invalid number of operands for less_than, expected 2, got #{operands.size} => #{operands}", operands, true)
      !operands[0].nil? && !operands[1].nil? && operands[0] < operands[1]
    end

    def self.greater_than(operands)
      operands.size == 2 or fail("Invalid number of operands for greater_than, expected 2, got #{operands.size} => #{operands}", operands, true)
      !operands[0].nil? && !operands[1].nil? && operands[0] > operands[1]
    end

    def self.contains(operands)
      operands.size == 2 or fail("Invalid number of operands for contains, expected 2, got #{operands.size} => #{operands}", operands, true)
      !operands[0].nil? && !operands[1].nil? &&operands[0].include?(operands[1])
    end

    def self.starts_with(operands)
      operands.size == 2 or fail("Invalid number of operands for starts_with, expected 2, got #{operands.size} => #{operands}", operands, true)
      !operands[0].nil? && operands[0].starts_with?(operands[1])
    end

    def self.greater_than_or_equals(operands)
      return equals(operands) || greater_than(operands)
    end

    def self.less_than_or_equals(operands)
      return equals(operands) || less_than(operands)
    end
  end
end
