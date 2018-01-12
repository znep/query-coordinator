require 'rails_helper'

# Translated very directly from prior Minitest code.
describe SodaCan::Order do

  def setup_orders
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/v6f4-jvr4.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/v6f4-jvr4-rows.json").read)
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

  it 'works for a single order-by' do
    sodacan, orders = setup_orders

    for i in 0..(orders.length - 1)
      condition = {
          "orderBys" => [ orders[i] ]
      }
      expect(sodacan.can_query?(condition)).to be_truthy # Query rejected by SodaCan #{JSON.pretty_generate(condition)}
      sorted_rows = sodacan.get_rows(condition)
      expect(sorted_rows).to be_truthy # Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}
      field = condition["orderBys"][0]["expression"]["fieldName"]
      columnId = condition["orderBys"][0]["expression"]["columnId"]
      key = SodaCan::Util.get_row_hash_key(field, columnId, sodacan.meta(), false)
      asc = condition["orderBys"][0]["ascending"]
      a = sorted_rows[0][key]
      b = sorted_rows.last[key]
      # simple coersion for nil strings
      a = a.nil? ? "" : a
      b = b.nil? ? "" : b
      expect(a <=> b).to eq(asc ? -1 : 1) # First row field, #{sorted_rows[0][field]} is not #{asc ? "less" : "greater"} than last row field #{sorted_rows.last[field]}
    end
  end

  it 'works for two order-bys' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/v6f4-jvr4.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/v6f4-jvr4-rows.json").read)
    rowdata['entries'] = rowdata['entries'].shuffle
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    ptext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    num_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "number"} }')
    condition = {
        "orderBys" => [ptext_asc, num_desc]
    }
    expect(sodacan.can_query?(condition)).to be_truthy # Query rejected by SodaCan #{JSON.pretty_generate(condition)}
    sorted_rows = sodacan.get_rows(condition)
    expect(sorted_rows).to be_truthy # Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}
    prev_row = nil
    sorted_rows.each { |r|
      unless prev_row.nil?
        expect(r['ptext']).to be >= prev_row['ptext']
        if r['ptext'] == prev_row['ptext']
          expect(r['number']).to be <= prev_row['number']
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
      expect(sodacan.can_query?(condition)).to be_truthy # Query rejected by SodaCan #{JSON.pretty_generate(condition)}
      sorted_rows = sodacan.get_rows(condition)
      expect(sorted_rows).to be_truthy # Order-by query failed #{JSON.pretty_generate(condition)} because #{JSON.pretty_generate(sodacan.hints)}
    end
  end

end
