module SodaCan
  class Order
    def self.validate_order_by(order_bys, metadata)
      return true if order_bys.nil?
      order_bys.each do |o|
        field = o["expression"]["fieldName"]
        columnId = o["expression"]["columnId"]
        Util.resolve_field_type(field, columnId, metadata) || Util.fail("Unable to resolve field type for #{field} in order-by", o)
      end
    end

    #
    # Order rows using order_bys
    #   - only supports references by fieldName
    #
    def self.order_rows(rows, order_bys, metadata, hash_by_ids = false)
      return rows if order_bys.nil? || order_bys.size <= 0
      rows.sort do |a, b|
        i, res = 0, 0
        div = 1
        begin
          field = order_bys[i]["expression"]["fieldName"]
          columnId = order_bys[i]["expression"]["columnId"]
          type = Util.resolve_field_type(field, columnId, metadata) || Util.fail("Unable to resolve field type for #{field} in order-by", order_bys[i], true)
          key = Util.get_row_hash_key(field, columnId, metadata, hash_by_ids)
          #Util.fail("unable to get value a[#{key}]", a, true) if a[key].nil?
          res += ( (Util.coerce_type(a[key],type) <=> Util.coerce_type(b[key],type)) * (!order_bys[i]["ascending"] ? -1.0 : 1.0 )) / div
          div *= 10.0
        end until (i+=1) == order_bys.size
        res <=> 0
      end
    end
  end
end
