module SodaCan
  class Order
    def self.validate_order_by(order_bys, metadata)
      return true if order_bys.nil?
      order_bys.each do |o|
        field = o["expression"]["fieldName"] || Util.fail("Order by only supports fieldName references", o)
        Util.resolve_field_type(field, nil, metadata) || Util.fail("Unable to resolve field type for #{field} in order-by", o)
      end
    end

    #
    # Order rows using order_bys
    #   - only supports references by fieldName
    #
    def self.order_rows(rows, order_bys, metadata)
      return rows if order_bys.nil? || order_bys.size <= 0
      rows.sort do |a, b|
        i, res = 0, 0
        div = 1
        begin
          field = order_bys[i]["expression"]["fieldName"] || Util.fail("Order by only supports fieldName references", order_bys[i], true)
          type = Util.resolve_field_type(field, nil, metadata) || Util.fail("Unable to resolve field type for #{field} in order-by", order_bys[i], true)
          res += ( (Util.coerce_type(a[field],type) <=> Util.coerce_type(b[field],type)) * (!order_bys[i]["ascending"] ? -1.0 : 1.0 )) / div
          div *= 10.0
        end until (i+=1) == order_bys.size
        res <=> 0
      end
    end
  end
end