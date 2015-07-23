module SodaCan
  INDEX_SCAN_OPS = %w(equals is_not_blank).freeze

  class Index
    def initialize(metadata)
      @index = {}
      @fields_to_index = []
      @ids_to_index = []
      @metadata = metadata
    end

    #
    # Perform an Index Scan of row data and return an array of row
    # indicies which match the query along with whether a partial
    # sequential scan of the indices or a full row seq is required.
    #
    # In the case that the index scan detects a full seq is required
    # it should stop the index scan entirely and
    #
    # Conditions requiring a partial scan:
    #      - one branch of an and having a non-indexable query
    # Conditions requiring a full row scan:
    #      - one branch of an OR requiring a non-indexable query
    def index_scan(part)
      result_seq_scan = false
      full_seq_scan = false
      rows = []
      noop_response = [ [], false, false]
      fail_response = [ nil, false, true]

      if part.nil? || part['type'].nil?
        return noop_response
      end
      if part['type'].to_s.downcase != "operator"
        return noop_responsee
      end

      operator = part['value'].to_s.downcase

      #
      # We could be slightly smarter here when part of a query
      # is indexable, by switching all /and/ behavior to /or/
      # That is; if we can perform indexing on a sub-query of
      # an and we should begin or-ing. Right now we are a pessimistic
      #
      if INDEX_SCAN_OPS.include?(operator)
        rows = index_column_scan(operator, part['children'])
      else
        case operator
          when "and"
            intersection = nil
            # find the set that match all conditions
            part['children'].each do |c|
              _rows, _result_scan, _full_scan  = index_scan(c)
              # any sub-branch requiring a full scan means we should short-circuit
              return fail_response if _full_scan
              result_seq_scan = true if _result_scan
              # if we require a partial result scan here, shoudn't we begin /or/-ing
              # everything from here-on out?
              intersection = intersection.nil? ? _rows : intersection & _rows
            end
            rows = intersection
          when "or"
            part['children'].each do |c|
              _rows, _result_scan, _full_scan  = index_scan(c)
              # And child which says it needs either a partial or full scan means
              # we need to do the full_scan on the entire row set anyways
              return fail_response if _full_scan || _result_scan
              rows = rows | _rows
            end
          else
            full_seq_scan = true
        end
      end
      [rows, result_seq_scan, full_seq_scan ]
    end

    # functor used by the can_query method which collects fields which
    # are candidates for indexing. This method always returns true.
    def register_fields_to_index_op(operator, children, row_unused)
      return true unless INDEX_SCAN_OPS.include?(operator)
      children.each do |c|
        if c['type'] == "column"
          field = c['columnFieldName']
          id = c['columnId']
          @fields_to_index << field unless ( field.nil? || @fields_to_index.include?(field) )
          @ids_to_index << id unless ( id.nil? || @ids_to_index.include?(id) )
        end
      end
      true
    end

    def update_index(rows, hash_by_ids)
      index_fields(rows, hash_by_ids)
    end

    def hints
      hints = {}
      @index.map { |k,v|
        hints[k] = v.size
      }
      hints
    end

    private

    #
    # Indexing Fields
    # Hash of Values Approach:
    #   - the operators are only EQUALS and NOT_BLANK
    #   - No multi-column operands; one literal, one column only
    # Array of Sorted Values:
    #   - more operators are supported (not contains)
    #   - No multi-column operands again
    #   - requires a binary search of the array
    #
    #
    # Since the Hash approach is considerably simplier; we will use that:
    # {[field] => {[value] => [row_ids]}}
    # create an index given the rows and fields specified
    def index_fields(rows, hash_by_ids)
      return if rows.nil?
      fields = @fields_to_index.select { |f|
        @index[f].nil?
      }
      ids = @ids_to_index.select { |f|
        @index[f].nil?
      }
      return if fields.nil? && ids.nil?
      i = 0
      rows.each { |r|
        fields.each { |f|
          next if f.nil?
          @index[f] ||= {}  # value hash
          @index[f] = Index.add_row_index(@index[f], r, i, f, nil, @metadata, hash_by_ids)
        }
        ids.each { |id|
          next if id.nil?
          @index[id] ||= {}
          @index[id] = Index.add_row_index(@index[id], r, i, nil, id, @metadata, hash_by_ids)
        }
        i += 1
      }
    end

    # {[value] => [row_indices]}
    def self.add_row_index(values, row, row_idx, field, id, metadata, hash_by_ids)
      Util.fail("no field or id set", [values, row_idx, field, id], true) if field.nil? && id.nil?
      type = Util.resolve_field_type(field, id, metadata)
      coerced_value = Util.resolve_column_value(row, type, field, id, metadata, hash_by_ids)
      values[coerced_value] ||= []
      values[coerced_value] << row_idx
      values
    end

    # Retrieves a list of row indices from an index given the operator and operands
    def index_column_scan(operator, children)
      Util.fail("operator #{operator} not supported by index column scan", children, true) unless INDEX_SCAN_OPS.include?(operator)
      Util.fail("index column scan only supports column/literal or column unary conditions", children, true) unless children.size <= 2

      columnKey = nil
      type = nil
      uncoereced_literal = nil
      children.each do |c|
        case c['type']
          when "column"
            type = Util.resolve_column_type(c, @metadata)
            Util.fail("two columns specified for scan", children, true) unless columnKey.nil?
            columnKey = c['columnFieldName'] || c['columnId']
          when "literal"
            uncoereced_literal = c['value']
        end
      end

      Util.fail("no column specified for index column scan", children, true) if columnKey.nil?
      @index[columnKey] ||= {}

      case operator
        when 'equals'
          coerced_literal = Util.coerce_type(uncoereced_literal, type)
          indices = @index[columnKey][coerced_literal] || []
          indices
        when 'is_not_blank'
          all_indices = []
          @index[columnKey].each { |k, v|
             all_indices = all_indices + v
          }
          return all_indices
        else
          Util.fail("index scan operator #{operator} not supported", children, true)
      end
    end
  end
end
