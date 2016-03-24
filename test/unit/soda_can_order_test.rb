require 'test_helper'

class SodaCanOrderTest  < Test::Unit::TestCase

  def setup_orders
    metadata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4-rows.json").read)
    rowdata['entries'] = rowdata['entries'].shuffle
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    ptext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    ptext_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    ftext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ftext"} }')
    ftext_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "ftext"} }')
    num_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "number"} }')
    num_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "number"} }')
    by_column = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "columnId" : 49493173} }')
    orders = [ ptext_asc, ptext_desc, ftext_asc, ftext_desc, num_asc, num_desc, by_column ]
    return sodacan, orders
  end

  def test_single_order_by
    sodacan, orders = setup_orders

    for i in 0..(orders.length - 1)
      condition = {
          "orderBys" => [ orders[i] ]
      }
      assert sodacan.can_query?(condition), "Query rejected by SodaCan #{JSON.pretty_generate(condition)}"
      sorted_rows = sodacan.get_rows(condition)
      assert sorted_rows, "Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}"
      field = condition["orderBys"][0]["expression"]["fieldName"]
      columnId = condition["orderBys"][0]["expression"]["columnId"]
      key = SodaCan::Util.get_row_hash_key(field, columnId, sodacan.meta(), false)
      asc = condition["orderBys"][0]["ascending"]
      a = sorted_rows[0][key]
      b = sorted_rows.last[key]
      # simple coersion for nil strings
      a = a.nil? ? "" : a
      b = b.nil? ? "" : b
      assert ((a <=> b) == (asc ? -1 : 1)), "First row field, #{sorted_rows[0][field]} is not #{asc ? "less" : "greater"} than last row field #{sorted_rows.last[field]}"
    end
  end

  def test_two_known_orders
    metadata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4-rows.json").read)
    rowdata['entries'] = rowdata['entries'].shuffle
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    ptext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    num_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "number"} }')
    condition = {
        "orderBys" => [ptext_asc, num_desc]
    }
    assert sodacan.can_query?(condition), "Query rejected by SodaCan #{JSON.pretty_generate(condition)}"
    sorted_rows = sodacan.get_rows(condition)
    assert sorted_rows, "Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}"
    prev_row = nil
    sorted_rows.each { |r|
      unless prev_row.nil?
        assert r['ptext'] >= prev_row['ptext']
        if r['ptext'] == prev_row['ptext']
          assert r['number'] <= prev_row['number']
        end
      end
    }
  end

  def test_multi_order_by
    sodacan, orders = setup_orders
    for i in 0 .. (orders.length - 1)
      mixed_orders = orders.select {|_| rand(2).zero? }
      condition = {
          "orderBys" => mixed_orders
      }
      assert sodacan.can_query?(condition), "Query rejected by SodaCan #{JSON.pretty_generate(condition)}"
      sorted_rows = sodacan.get_rows(condition)
      assert sorted_rows, "Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}"
    end
  end

end
