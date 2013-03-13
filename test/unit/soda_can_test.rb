class SodaCanTest < Test::Unit::TestCase
  ROW_META_LAST_INDX = 7.freeze

  def test_isfilterable
    sodacan = SodaCan.new({}, nil)
    queries= JSON::parse(File.open("test/fixtures/soda_can/query_pass.json").read)
    queries.each { |q|
      assert sodacan.soda_can?(q), "Should have passed: #{q.to_s}"

    }
    queries= JSON::parse(File.open("test/fixtures/soda_can/query_fail.json").read)
    queries.each { |q|
      assert !sodacan.soda_can?(q), "Should have failed: #{q.to_s}"
    }

  end

  def test_get_field_index
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    assert sodacan.get_field_index("employee_name", nil) == 8
    assert sodacan.get_field_index("pay_basis", nil) == 11

    begin
      sodacan.get_field_index("not_there", nil)
      assert false
    rescue Exception
      # expected
    end

    assert sodacan.get_field_index(nil, 2519204) == 8
    assert sodacan.get_field_index(nil, 2519207) == 11

    assert sodacan.get_field_index("employee_name", 2519204) == 8
  end

  def test_resolve_value
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "employee_name"}')
    assert sodacan.resolve_value(atom, row) == "Zichal, Heather R."

    atom = JSON::parse('{ "type" : "column", "columnFieldName" : "not_there"}')
    assert sodacan.resolve_value(atom, row).nil?
  end

  def test_resolve_literal
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    row = rowdata['entries'][0]
    atom = JSON::parse('{ "type" : "literal", "value" : "alphabet"}')
    assert sodacan.resolve_value(atom, row) == "alphabet"
  end

  def test_perform_equals
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    row = rowdata['entries'][0]
    atom = JSON::parse('[{ "type" : "literal", "value" : "Zichal, Heather R."}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    assert sodacan.perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Zichal, Heather R."}]')
    assert sodacan.perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}, { "type" : "literal", "value" : "Wrong; All Wrong"}]')
    assert !sodacan.perform_op("EQUALS", atom, row)
    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}, { "type" : "column", "columnFieldName" : "employee_name"}]')
    assert !sodacan.perform_op("EQUALS", atom, row)
  end


  def test_by_ids
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids.json").read)
    sodacan = SodaCan.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    assert sodacan.can_query? equals
    assert sodacan.get_rows(equals).size == 1, ">>>> GOT : #{sodacan.get_rows(equals).to_json}"
  end

  def test_by_ids_meta
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan = SodaCan.new(metadata, rowdata, true)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    assert sodacan.can_query? equals
    assert sodacan.get_rows(equals).size == 1
  end

  def test_as_array
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-array.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    equals = create_filter("EQUALS", "Zichal, Heather R.", "employee_name")
    assert sodacan.can_query? equals
    assert sodacan.get_rows(equals).size == 1
  end

  def test_perform_blanks
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
    row = { "employee_name" => "This is not blank",
    }


    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "employee_name"}]')
    assert sodacan.perform_op("IS_NOT_BLANK", atom, row)
    assert !sodacan.perform_op("IS_BLANK", atom, row)

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "salary"}]')
    assert sodacan.perform_op("IS_BLANK", atom, row)
    assert !sodacan.perform_op("IS_NOT_BLANK", atom, row)

    atom = JSON::parse('[{ "type" : "column", "columnFieldName" : "pay_basis"}]')
    assert sodacan.perform_op("IS_BLANK", atom, row)
    assert !sodacan.perform_op("IS_NOT_BLANK", atom, row)
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
    sodacan = SodaCan.new(metadata, rowdata)
    queries.each { |q|
      got = sodacan.get_rows(q).to_json
      assert(got == q['expect'].to_json, "fixture failed test: " + q['description'] + " got: #{got}")
    }
  end

  OPERATION_COL_NAME = "compare_to_first".freeze
  def test_all_the_types
    metadata = JSON::parse(File.open("test/fixtures/soda_can/8vyz-328w.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/8vyz-328w-rows.json").read)
    sodacan = SodaCan.new(metadata, rowdata)
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

  def setup_orders
    metadata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/v6f4-jvr4-rows.json").read)
    rowdata['entries'] = rowdata['entries'].shuffle
    sodacan = SodaCan.new(metadata, rowdata)
    ptext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    ptext_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "ptext"} }')
    ftext_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "ftext"} }')
    ftext_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "ftext"} }')
    num_asc = JSON::parse('{ "ascending" : true, "expression" : { "type" : "column", "fieldName" : "number"} }')
    num_desc = JSON::parse('{ "ascending" : false, "expression" : { "type" : "column", "fieldName" : "number"} }')
    orders = [ ptext_asc, ptext_desc, ftext_asc, ftext_desc, num_asc, num_desc ]
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
      asc = condition["orderBys"][0]["ascending"]
      a = sorted_rows[0][field]
      b = sorted_rows.last[field]
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
    sodacan = SodaCan.new(metadata, rowdata)
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

  def test_paging
    metadata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb.json").read)
    rowdata = JSON::parse(File.open("test/fixtures/soda_can/vedg-c5sb-byids-meta.json").read)
    sodacan = SodaCan.new(metadata, rowdata, true)
    per_page = 100
    num_rows = sodacan.get_rows({}, per_page, 1).length
    row_count = num_rows
    page = 2
    while num_rows == per_page
      num_rows = sodacan.get_rows({}, per_page, page).length
      row_count += num_rows
      page +=1
    end
    assert row_count == rowdata["data"].length
  end


end