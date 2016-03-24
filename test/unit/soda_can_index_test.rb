require 'test_helper'

class SodaCanIndexTest < Test::Unit::TestCase

  def test_aspe_index
    metadata = JSON::parse(File.open("test/fixtures/soda_can/74nx-npbu.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/74nx-npbu-rows.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, false)
    query_json = <<eos
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
eos
    query = JSON::parse(query_json)
    assert sodacan.can_query? (query)
    num_rows = sodacan.get_rows(query).size
    assert num_rows == 15, "because #{sodacan.hints} rows #{num_rows}"
    sodacan.hints[:indexer].each { |field, unique_vals|
      case field
        when 'type'
          assert unique_vals == 3  # Only Goals, Objectives, Strategies
        when 'archive'
          assert unique_vals == 1
        else
          fail
      end
    }
  end

end
