require 'rails_helper'

# NOTE: SodaCan is generally impenetrable, so this test file and the ones in the
# same module are direct translations of existing Minitest code.

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

describe SodaCan::Processor do
  it 'does something with filters' do
    sodacan = ProcessorTestHelper.new({}, nil)
    queries= JSON::parse(File.open("spec/fixtures/soda_can/query_pass.json").read)
    queries.each { |q|
      expect(sodacan.public_soda_can?(q)).to be_truthy # Should have passed: #{q}

    }
    queries= JSON::parse(File.open("spec/fixtures/soda_can/query_fail.json").read)
    queries.each { |q|
      expect(sodacan.public_soda_can?(q)).to be_falsy # Should have failed: #{q}
    }
  end

  it 'resolves values given a column field name' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-rows.json").read)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "employee_name"}')
    expect(SodaCan::Util.resolve_value(atom, row, metadata, false)).to eq("Zichal, Heather R.")

    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "not_there"}')
    expect(SodaCan::Util.resolve_value(atom, row, metadata, false)).to be(nil)
  end

  it 'resolves values given a literal' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-rows.json").read)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "literal", "value" : "alphabet"}')
    expect(SodaCan::Util.resolve_value(atom, row, metadata, false)).to eq("alphabet")
  end

  it 'performs EQUALS op' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = ProcessorTestHelper.new(metadata, rowdata)
    row = rowdata['entries'][0]
    atom = JSON::parse('[{ "type" : "literal", "value" : "Zichal, Heather R."}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    expect(sodacan.public_perform_op("EQUALS", atom, row)).to be_truthy
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Zichal, Heather R."}]')
    expect(sodacan.public_perform_op("EQUALS", atom, row)).to be_truthy
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Wrong; All Wrong"}]')
    expect(sodacan.public_perform_op("EQUALS", atom, row)).to be_falsy
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    expect(sodacan.public_perform_op("EQUALS", atom, row)).to be_falsy
  end

  # NOTE: not sure this description is right
  it 'works with queries by ID?' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-byids.json").read)
    sodacan = SodaCan::Processor.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    expect(sodacan.can_query?(equals)).to be_truthy
    expect(sodacan.get_rows(equals).size).to eq(1) # >>>> because : #{sodacan.hints}
  end

  # NOTE: not sure this description is right
  it 'works with queries by ID and meta?' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan = SodaCan::Processor.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    expect(sodacan.can_query?(equals)).to be_truthy
    expect(sodacan.get_rows(equals).size).to eq(1)
  end

  it 'performs IS_BLANK and IS_NOT_BLANK ops' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = ProcessorTestHelper.new(metadata, rowdata)
    row = { "employee_name" => "This is not blank" }

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}]')
    expect(sodacan.public_perform_op("IS_NOT_BLANK", atom, row)).to be_truthy
    expect(sodacan.public_perform_op("IS_BLANK", atom, row)).to be_falsy

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "salary"}]')
    expect(sodacan.public_perform_op("IS_BLANK", atom, row)).to be_truthy
    expect(sodacan.public_perform_op("IS_NOT_BLANK", atom, row)).to be_falsy

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}]')
    expect(sodacan.public_perform_op("IS_BLANK", atom, row)).to be_truthy
    expect(sodacan.public_perform_op("IS_NOT_BLANK", atom, row)).to be_falsy
  end

  def create_filter(operation, literal, field_name)
    query_literal = literal.to_json

    query_json = <<~QUERY
      {
        "filterCondition": {
          "type" : "operator",
          "value" : "#{operation}",
          "children" : [ {
            "type": "literal",
            "value": #{query_literal}
          }, {
            "type" : "column",
            "columnFieldName" : "#{field_name}"
          }]
        }
      }
    QUERY
    JSON::parse(query_json)
  end

  #
  #  Uses a dataset with all available types and walks the dataset performing most operations to verify
  #  that a "BASELINE" row always appears in the results
  #

  # NOTE: not sure this description is right
  it 'does something with filters?' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-rows.json").read)
    queries = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-queries.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata)
    queries.each { |q|
      expect(sodacan.can_query?(q)).to be_truthy
      got = sodacan.get_rows(q).to_json
      expect(got).to eq(q['expect'].to_json) # fixture failed test: " + q['description'] + " got: #{got} why? #{sodacan.hints}"
    }
  end

  OPERATION_COL_NAME = "compare_to_first".freeze
  # NOTE: not sure this description is right
  it 'works with all types?' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/8vyz-328w.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/8vyz-328w-rows.json").read)
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
        expect(sodacan.can_query?(query)).to be_truthy # Query rejected by SodaCan: #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}

        got_baseline = false
        begin
          result_set = sodacan.get_rows(query)
          result_set.each { |r|
            expect(r).to be_instance_of(Hash) # Expected r as hash #{r.inspect} set #{result_set}
            got_baseline = true if r[OPERATION_COL_NAME] == "BASELINE"
          }
          expect(got_baseline).to be_truthy # No baseline in result set, rows returned: \n #{JSON.pretty_generate(result_set)} for query #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}
        rescue Exception
          puts "Query threw exception: #{JSON.pretty_generate(query)} because #{JSON.pretty_generate(sodacan.hints)}"
          fail
        end
      }

    }
  end

  it 'works with paging' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, true)
    per_page = 100
    num_rows = sodacan.get_rows({}, per_page, 1).length
    expect(num_rows).to eq(per_page)
    row_count = num_rows
    page = 2
    while num_rows == per_page
      num_rows = sodacan.get_rows({}, per_page, page).length
      row_count += num_rows
      page +=1
    end
    expect(row_count).to eq(rowdata["data"].length) # Row count is #{row_count} / #{rowdata["data"].length}
  end

  # This is the original test name.
  it 'test_ASPE_RM9793_orderBys_parsing' do
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
    QUERY
    query = JSON::parse(query_json)
    expect(sodacan.can_query?(query)).to be_truthy
    expect(SodaCan::Util.is_not_blank([ false ])).to be_falsy
    expect(SodaCan::Util.is_not_blank([ true ])).to be_truthy
    expect(SodaCan::Util.is_blank([ true ])).to be_falsy
    expect(sodacan.get_rows(query).size).to be > 0 # because #{sodacan.hints}
  end

  # This is the original test name.
  it 'test_ASPE_RM10031_number_literals_as_strings' do
    metadata = JSON::parse(File.open("spec/fixtures/soda_can/74nx-npbu.json").read)
    rowdata = JSON::parse(File.open("spec/fixtures/soda_can/74nx-npbu-rows.json").read)
    sodacan =SodaCan::Processor.new(metadata, rowdata, false)
    query_json = <<~QUERY
      {
        "filterCondition" : {
          "value": "EQUALS",
          "children": [ {
            "type": "column",
            "columnFieldName": "goal_id"
          } , {
            "value": "5",
            "type": "literal"
          } ],
          "type": "operator"
        }
      }
    QUERY
    query = JSON::parse(query_json)
    expect(sodacan.can_query?(query)).to be_truthy
    expect(sodacan.send(:perform_op, "equals", query['filterCondition']['children'], rowdata['entries'][4])).to be_truthy
    expect(sodacan.get_rows(query).size).to be > 0 # because #{sodacan.hints}
  end

end
