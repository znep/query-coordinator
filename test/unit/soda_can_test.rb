require 'test_helper'

class ProcessorTestHelper < SodaCan::Processor

  def initialize(*args)
    super(*args)
  end

  def public_soda_can?(part, positive_cb = -> a,n,r {true}, row = {})
      soda_can?(part, positive_cb = -> a,n,r {true}, row = {})
  end

  def public_perform_op(operator, children, row)
     perform_op(operator, children, row)
  end

end

class SodaCanTest < Test::Unit::TestCase
  ROW_META_LAST_INDX = 7.freeze

  def test_isfilterable
    sodacan = ProcessorTestHelper.new({}, nil)
    queries= JSON::parse(File.open("test/fixtures/soda_can/query_pass.json").read)
    queries.each { |q|
      assert sodacan.public_soda_can?(q), "Should have passed: #{q.to_s}"

    }
    queries= JSON::parse(File.open("test/fixtures/soda_can/query_fail.json").read)
    queries.each { |q|
      assert !sodacan.public_soda_can?(q), "Should have failed: #{q.to_s}"
    }
  end

  def test_resolve_value
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "employee_name"}')
    assert SodaCan::Util.resolve_value(atom, row, metadata, false) == "Zichal, Heather R."

    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "not_there"}')
    assert SodaCan::Util.resolve_value(atom, row, metadata, false).nil?
  end

  def test_resolve_literal
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "literal", "value" : "alphabet"}')
    assert SodaCan::Util.resolve_value(atom, row, metadata, false) == "alphabet"
  end

  def test_perform_equals
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = ProcessorTestHelper.new(metadata, rowdata)
    row = rowdata['entries'][0]
    atom = JSON::parse('[{ "type" : "literal", "value" : "Zichal, Heather R."}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    assert sodacan.public_perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Zichal, Heather R."}]')
    assert sodacan.public_perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Wrong; All Wrong"}]')
    assert !sodacan.public_perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    assert !sodacan.public_perform_op("EQUALS", atom, row)
  end

  def test_by_ids
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids.json").read)
    sodacan = SodaCan::Processor.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    assert sodacan.can_query? equals
    assert sodacan.get_rows(equals).size == 1, ">>>> because : #{sodacan.hints}"
  end

  def test_by_ids_meta
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan = SodaCan::Processor.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    assert sodacan.can_query? equals
    assert sodacan.get_rows(equals).size == 1
  end

  def test_perform_blanks
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = ProcessorTestHelper.new(metadata, rowdata)
    row = { "employee_name" => "This is not blank",
    }


    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}]')
    assert sodacan.public_perform_op("IS_NOT_BLANK", atom, row)
    assert !sodacan.public_perform_op("IS_BLANK", atom, row)

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "salary"}]')
    assert sodacan.public_perform_op("IS_BLANK", atom, row)
    assert !sodacan.public_perform_op("IS_NOT_BLANK", atom, row)

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}]')
    assert sodacan.public_perform_op("IS_BLANK", atom, row)
    assert !sodacan.public_perform_op("IS_NOT_BLANK", atom, row)
  end

  def create_filter(operation, literal, field_name)
    query_literal = literal.to_json

    query_json = <<eos
          { "filterCondition": {
            "type" : "operator",
            "value" : "#{operation}",
            "children" : [ {
              "type": "literal",
              "value": #{query_literal}
            }, {
              "type" : "column",
              "columnFieldName" : "#{field_name}"
            }]
          } }
eos
    JSON::parse(query_json)
  end

  #
  #  Uses a dataset with all available types and walks the dataset performing most operations to verify
  #  that a "BASELINE" row always appears in the results
  #
  def test_can_filter
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    queries = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-queries.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    queries.each { |q|
      assert sodacan.can_query?(q)
      got = sodacan.get_rows(q).to_json
      assert(got == q['expect'].to_json, "fixture failed test: " + q['description'] + " got: #{got} why? #{sodacan.hints}")
    }
  end

  OPERATION_COL_NAME = "compare_to_first".freeze
  def test_all_the_types
    metadata = JSON::parse(File.open("test/fixtures/soda_can/8vyz-328w.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/8vyz-328w-rows.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    # for each column[1:] in the dataset (excluding the first column)
    #     for each row[1:] in the dataset (excluding the first row)
    #        if the value of row[n]column[n] is blank, skip
    #        build a unary query using the operator in row[n]column[0] which compares row[n]column[n] to row[0]column[n]
    #        pass the query through soda can and verify the operation was successful
    metadata['columns'].each { |c|
      if c['position'] == 1
        next
      end
      field_name = c['fieldName']
      rowdata['entries'].each { |r|
        if r[field_name].nil?
          next
        end
        if r[OPERATION_COL_NAME] == "BASELINE"
          next
        end
        operation = r[OPERATION_COL_NAME]
        if field_name == "nested_table"
          next
        end
        if r[field_name].class == Hash && operation != "EQUALS"  && operation != "NOT_EQUALS"
          next
        end
        query = create_filter(operation, r[field_name], field_name)
        assert sodacan.can_query?(query), "Query rejected by SodaCan: #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}"

        got_baseline = false
        begin
          result_set = sodacan.get_rows(query)
          result_set.each { |r|
            assert r.class == Hash, "Expected r as hash #{r.inspect} set #{result_set}"
            got_baseline = true if r[OPERATION_COL_NAME] == "BASELINE"
          }
          assert got_baseline, "No baseline in result set, rows returned: \n #{JSON.pretty_generate(result_set)} for query #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}"
        rescue Exception
          puts "Query threw exception: #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}"
          assert fail
        end
      }

    }
  end

  def test_paging
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, true)
    per_page = 100
    num_rows = sodacan.get_rows({}, per_page, 1).length
    assert num_rows == per_page
    row_count = num_rows
    page = 2
    while num_rows == per_page
      num_rows = sodacan.get_rows({}, per_page, page).length
      row_count += num_rows
      page +=1
    end
    assert row_count == rowdata["data"].length, "Row count is #{row_count} / #{rowdata["data"].length}"
  end

  def test_ASPE_RM9793_orderBys_parsing
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
            "type" : "operator", "value" : "IS_BLANK",
            "children" : [ {
              "type" : "column", "columnFieldName" : "archive"
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
    assert !SodaCan::Util.is_not_blank([ false ])
    assert SodaCan::Util.is_not_blank([ true ])
    assert !SodaCan::Util.is_blank([ true ])
    assert sodacan.get_rows(query).size > 0, "because #{sodacan.hints}"

  end

  def test_ASPE_RM10031_number_literals_as_strings
    metadata = JSON::parse(File.open("test/fixtures/soda_can/74nx-npbu.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/74nx-npbu-rows.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, false)
    query_json = <<eos
      {
        "filterCondition" : {
          "value": "EQUALS",
          "children": [
          {
            "type": "column",
            "columnFieldName": "goal_id"
          },
          {
            "value": "5",
            "type": "literal"
          }
          ],
          "type": "operator"
        }
      }
eos
    query = JSON::parse(query_json)
    assert sodacan.can_query? (query)
    assert sodacan.send :perform_op, "equals", query['filterCondition']['children'], rowdata['entries'][4]
    assert sodacan.get_rows(query).size > 0, "because #{sodacan.hints}"

  end

end
