require 'rails_helper'

describe SodaCan::Index do

  # I have no idea what this test is intended to do, nor the purpose of SodaCan.
  # Just trying to shift all of this old stuff out of Minitest.
  it 'does something' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/74nx-npbu.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/74nx-npbu-rows.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, false)
    query_json = <<~QUERY
      {
        "filterCondition" : {
          "type" : "operator", "value" : "AND",
          "children" : [ {
            "type" : "operator", "value" : "EQUALS",
            "children" : [ {
              "type" : "column", "columnFieldName" : "type"
            }, {
              "type" : "literal", "value" : "Goal"
            } ]
          }, {
            "type" : "operator", "value" : "EQUALS",
            "children" : [ {
              "type" : "column", "columnFieldName" : "archive"
            },{
              "type" : "literal", "value" : false
            } ]
          } ]
        },
        "orderBys" : [ {
          "ascending" : true,
          "expression" : {
            "type" : "column", "fieldName" : "sort_order"
          }
        } ]
      }
    QUERY

    query = JSON::parse(query_json)
    expect(sodacan.can_query?(query)).to be_truthy
    num_rows = sodacan.get_rows(query).size
    expect(num_rows).to eq(15) # because #{sodacan.hints} rows #{num_rows}
    sodacan.hints[:indexer].each { |field, unique_vals|
      case field
        when 'type'
          expect(unique_vals).to eq(3)  # Only Goals, Objectives, Strategies
        when 'archive'
          expect(unique_vals).to eq(1)
        else
          fail
      end
    }
  end

end
