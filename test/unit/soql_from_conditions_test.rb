if ENV['COVERAGE']
  require 'simplecov'
  require 'simplecov-cobertura'
  SimpleCov.start do
    add_filter { |src| !(src.filename =~ /soql_duct_tape/) }
  end
end

require_relative '../test_helper'
require 'soql_duct_tape'
require 'pry'

class JsonQueryFromDatasetTest < Test::Unit::TestCase
  include SoqlFromConditions

  def setup
    init_current_domain
    load_sample_data('test/fixtures/sample-data.json')
    @view = View.find('test-data')
  end

  def test_search_string
    search_string = 'some search string'
    @view.stubs(searchString: search_string)
    assert_equal JsonQueryFromDataset.new(@view).search, search_string
  end

  def test_order_bys
    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.orderBys = [ {
        ascending: false,
        expression: {
          columnId: 48,
          type: "column"
        }
      }]
    end

    @view.stubs(query: query_hashie)
    order_bys = JsonQueryFromDataset.new(@view).order
    correct_shape = [
      { 'columnFieldName' => 'thingies',
        'ascending' => false
      }
    ]
    recursive_assert_array order_bys, correct_shape

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.orderBys = [ {
        ascending: true,
        expression: {
          columnId: 48,
          type: "column"
        }
      }]
    end

    @view.stubs(query: query_hashie)
    order_bys = JsonQueryFromDataset.new(@view).order
    correct_shape = [
      { 'columnFieldName' => 'thingies',
        'ascending' => true
      }
    ]
    recursive_assert_array order_bys, correct_shape

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.orderBys = [ {
        ascending: false,
        expression: {
          columnId: 48,
          type: "column"
        }
      }, {
        ascending: true,
        expression: {
          columnId: 49,
          type: "column"
        }
      }]
    end

    @view.stubs(query: query_hashie)
    order_bys = JsonQueryFromDataset.new(@view).order
    correct_shape = [
      { 'columnFieldName' => 'thingies',
        'ascending' => false
      },
      { 'columnFieldName' => 'moar_things',
        'ascending' => true
      }
    ]
    recursive_assert_array order_bys, correct_shape
  end

  def test_group_bys
    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }]
    end

    @view.stubs(query: query_hashie)
    group_bys = JsonQueryFromDataset.new(@view).group.collect(&:to_hash)
    correct_shape = [
      { 'columnFieldName' => 'thingies' }
    ]
    recursive_assert_array group_bys, correct_shape

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }, {
        columnId: 49,
        type: "column"
      }]
    end

    @view.stubs(query: query_hashie)
    group_bys = JsonQueryFromDataset.new(@view).group.collect(&:to_hash)
    correct_shape = [
      { 'columnFieldName' => 'moar_things' },
      { 'columnFieldName' => 'thingies' }
    ]
    recursive_assert_array group_bys, correct_shape

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }, {
        columnId: 49,
        type: "column"
      }]
    end

    @view.columns.find { |c| c.id == 48 }.stubs({
      has_group_function?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.group_function = 'sum' }
    })
    @view.stubs(query: query_hashie)
    group_bys = JsonQueryFromDataset.new(@view).group.collect(&:to_hash)
    correct_shape = [
      { 'columnFieldName' => 'moar_things' },
      { 'columnFieldName' => 'thingies',
        'groupFunction' => 'sum' }
    ]
    recursive_assert_array group_bys, correct_shape, 'group-on-sum'

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }, {
        columnId: 49,
        type: "column"
      }]
    end

    @view.columns.find { |c| c.id == 48 }.stubs({
      has_group_function?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.group_function = 'date_ym' },
      renderTypeName: 'date'
    })
    @view.stubs(query: query_hashie)
    group_bys = JsonQueryFromDataset.new(@view).group.collect(&:to_hash)
    correct_shape = [
      { 'columnFieldName' => 'moar_things' },
      { 'columnFieldName' => 'thingies',
        'groupFunction' => 'datez_trunc_ym' }
    ]
    recursive_assert_array group_bys, correct_shape, 'group-on-date'

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }, {
        columnId: 49,
        type: "column"
      }]
    end

    @view.columns.find { |c| c.id == 48 }.stubs({
      has_group_function?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.group_function = 'date_ym' },
      renderTypeName: 'calendar_date'
    })
    @view.stubs(query: query_hashie)
    group_bys = JsonQueryFromDataset.new(@view).group.collect(&:to_hash)
    correct_shape = [
      { 'columnFieldName' => 'moar_things' },
      { 'columnFieldName' => 'thingies',
        'groupFunction' => 'date_trunc_ym' }
    ]
    recursive_assert_array group_bys, correct_shape, 'group-on-date'
  end

  def test_split_filter_conditions_into_where_and_having
    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'BETWEEN',
        'children' => [
          { 'type' => 'column',
            'columnId' => 48 },
          { 'type' => 'literal',
            'value' => '1' },
          { 'type' => 'literal',
            'value' => '5' }
      ]}
    end

    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_where = {
      'columnFieldName' => 'thingies',
      'value' => ['1', '5'],
      'operator' => 'BETWEEN'
    }
    recursive_assert_hash json_query.where, correct_where, 'between'
    assert json_query.having.nil?

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'EQUALS',
        'children' => [
          { 'type' => 'column',
            'columnId' => 44 },
          { 'type' => 'literal',
            'value' => 'Green' }
      ]}
    end

    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_where = {
      'columnFieldName' => 'color',
      'value' => 'Green',
      'operator' => 'EQUALS'
    }
    recursive_assert_hash json_query.where, correct_where, 'where-only'
    assert json_query.having.nil?

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'EQUALS',
        'children' => [
          { 'type' => 'column',
            'columnId' => 44 },
          { 'type' => 'literal',
            'value' => 'Green' }
      ]}
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }]
    end

    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_where = {
      'columnFieldName' => 'color',
      'value' => 'Green',
      'operator' => 'EQUALS'
    }
    recursive_assert_hash json_query.where, correct_where, 'where-grouping-other'
    assert json_query.having.nil?

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'EQUALS',
        'children' => [
          { 'type' => 'column',
            'columnId' => 48 },
          { 'type' => 'literal',
            'value' => '5' }
      ]}
      hashie.groupBys = [ {
        columnId: 48,
        type: "column"
      }]
    end

    @view.columns.find { |c| c.id == 48 }.stubs({
      is_grouping_aggregate?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.grouping_aggregate = 'maximum' }
    })
    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_having = {
      'columnFieldName' => 'max_thingies',
      'value' => '5',
      'operator' => 'EQUALS'
    }
    recursive_assert_hash json_query.having, correct_having, 'having-max'
    assert json_query.where.nil?

    # tear down
    @view.columns.find { |c| c.id == 48 }.stubs({
      is_grouping_aggregate?: false,
      format: Hashie::Mash.new.tap { |hsh| hsh.grouping_aggregate = nil }
    })

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'EQUALS',
        'children' => [
          { 'type' => 'column',
            'columnId' => 44 },
          { 'type' => 'literal',
            'value' => 'Green' }
      ]}
      hashie.groupBys = [ {
        columnId: 44,
        type: "column"
      }]
    end

    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_having = {
      'columnFieldName' => 'color',
      'value' => 'Green',
      'operator' => 'EQUALS'
    }
    assert json_query.where.nil?
    recursive_assert_hash json_query.having, correct_having, 'having-only'

    query_hashie = Hashie::Mash.new.tap do |hashie|
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'AND',
        'children' => [{
          'type' => 'operator',
          'value' => 'EQUALS',
          'children' => [
            { 'type' => 'column',
              'columnId' => 44 },
            { 'type' => 'literal',
              'value' => 'Green' }
        ]}, {
          'type' => 'operator',
          'value' => 'EQUALS',
          'children' => [
            { 'type' => 'column',
              'columnId' => 48 },
            { 'type' => 'literal',
              'value' => '5' }
        ]}
      ]}
      hashie.groupBys = [ {
        columnId: 44,
        type: "column"
      }]
    end

    @view.stubs(query: query_hashie)
    json_query = JsonQueryFromDataset.new(@view)
    correct_where = {
      'operator' => 'AND',
      'children' => [{
        'columnFieldName' => 'thingies',
        'value' => '5',
        'operator' => 'EQUALS'
      }]
    }
    correct_having = {
      'operator' => 'AND',
      'children' => [{
        'columnFieldName' => 'color',
        'value' => 'Green',
        'operator' => 'EQUALS'
      }]
    }
    recursive_assert_hash json_query.where, correct_where, 'where-with-both'
    recursive_assert_hash json_query.having, correct_having, 'having-with-both'
  end

  private
  def failure_message(expected, actual, key)
    [
      "     key: #{key}",
      "expected: #{expected}",
      "  actual: #{actual}"
    ].join($/)
  end

  def recursive_assert_array(actual, expected, path = '')
    assert actual.present?, "#{path} is missing."
    assert actual.size == expected.size,
      "#{path} should have #{expected.size} items, but has #{actual.size}"
    expected.each_with_index do |item, index|
      new_path = path + ".#{index}"
      case item
      when Hash
        recursive_assert_hash(actual[index], item, new_path)
      when Array
        recursive_assert_array(actual[index], item, new_path)
      else
        assert item == actual[index], failure_message(item, actual[index], new_path)
      end
    end
  end

  def recursive_assert_hash(actual, expected, path = '')
    assert actual.present?, "#{path} is missing."
    assert actual.size == expected.size,
      "#{path} should be #{expected.size}, but is #{actual.size}"
    expected.each do |key, value|
      new_path = path + ".#{key}"
      case value
      when Hash
        recursive_assert_hash(actual[key], value, new_path)
      when Array
        recursive_assert_array(actual[key], value, new_path)
      else
        assert value == actual[key], failure_message(value, actual[key], new_path)
      end
    end
  end
end

class SoqlFromJsonQueryTest < Test::Unit::TestCase
  include SoqlFromConditions

  def setup
    init_current_domain
    load_sample_data('test/fixtures/sample-data.json')
    @view = View.find('test-data')
    @parent_view = View.find('test-data')
    @parent_view.stubs(:id => 'pare-ntds')
  end

  def test_search
    search_string = 'some search string'

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.search = search_string
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql
    correct_soql = "$search=#{search_string}"
    assert soql == correct_soql, failure_message(correct_soql, soql)

    base_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @parent_view
      hashie.search = ''
    end

    soql = SoqlFromJsonQuery.new(json_query, base_query).to_soql
    # I don't understand why this is correct.
    correct_soql = "$search=#{search_string}"
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  def test_order
    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.order = [
        { 'columnFieldName' => 'thingies',
          'ascending' => false
        }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$order']
    correct_soql = 'thingies desc'
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.order = [
        { 'columnFieldName' => 'thingies',
          'ascending' => true
        }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$order']
    correct_soql = 'thingies'
    assert soql == correct_soql, failure_message(correct_soql, soql)

    view_double = @view.dup
    view_double.columns.find { |c| c.id == 48 }.stubs({
      is_group_aggregate?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.grouping_aggregate = 'sum' },
      renderTypeName: 'date'
    })
    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = view_double
      hashie.order = [
        { 'columnFieldName' => 'thingies',
          'ascending' => false
        }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$order']
    correct_soql = 'sum(thingies) desc'
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  def test_filter_clause
    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'EQUALS',
        'columnFieldName' => 'color',
        'value' => 'Green'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(UPPER(color)=UPPER('Green'))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'EQUALS',
        'columnFieldName' => 'things',
        'value' => '5'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(things=5)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'GREATER_THAN',
        'columnFieldName' => 'things',
        'value' => '5'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(things>5)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'IS_NOT_BLANK',
        'columnFieldName' => 'color'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(color is not null)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'AND',
        'children' => [{
          'operator' => 'EQUALS',
          'columnFieldName' => 'color',
          'value' => 'Green' },
        { 'operator' => 'EQUALS',
          'columnFieldName' => 'things',
          'value' => '5' }
        ]
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{((UPPER(color)=UPPER('Green')) AND (things=5))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'BETWEEN',
        'columnFieldName' => 'things',
        'value' => ['1','5']
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(things>=1 AND things<=5)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'STARTS_WITH',
        'columnFieldName' => 'things',
        'value' => '2'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(starts_with(things,2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'NOT_CONTAINS',
        'columnFieldName' => 'things',
        'value' => '2'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(not contains(things,2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'IS_BLANK',
        'columnFieldName' => 'chechechecheckbox'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(not chechechecheckbox)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'IS_NOT_BLANK',
        'columnFieldName' => 'chechechecheckbox'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(chechechecheckbox)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'IS_NOT_BLANK',
        'columnFieldName' => 'you_are_a_star'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(you_are_a_star is not null)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'GREATER_THAN',
        'columnFieldName' => 'you_are_a_star',
        'value' => '2'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(to_number(you_are_a_star)>2)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'GREATER_THAN',
        'columnFieldName' => 'all_the_monies',
        'value' => '2'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(all_the_monies>to_usd(2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.where = {
        'operator' => 'BETWEEN',
        'columnFieldName' => 'someday_sometime',
        'value' => ['11/09/2015', '12/31/2015']
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$where']
    correct_soql = %{(someday_sometime>='2015-11-09T00:00:00Z' AND someday_sometime<='2015-12-31T00:00:00Z')}
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  def test_no_where_on_base_query
  end

  def test_having
    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.having = {
        'columnFieldName' => 'thingies',
        'value' => '5',
        'operator' => 'EQUALS'
      }
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$having']
    correct_soql = %{(thingies=5)}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    # This case doesn't seem to appear anywhere in production, which confuses the hell out of me.
    #json_query = Hashie::Mash.new.tap do |hashie|
    #  hashie.ds = @view
    #  hashie.having = {
    #    'columnFieldName' => 'max_thingies',
    #    'value' => '5',
    #    'operator' => 'EQUALS'
    #  }
    #end
    
    #soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$having']
    #correct_soql = %{(max_thingies=5)}
    #assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  def test_group
    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.group = [
        { 'columnFieldName' => 'thingies' }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$group']
    correct_soql = %{thingies}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.group = [
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies' }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$group']
    correct_soql = %{moar_things,thingies}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    json_query = Hashie::Mash.new.tap do |hashie|
      hashie.ds = @view
      hashie.group = [
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies',
          'groupFunction' => 'sum' }
      ]
    end

    soql = SoqlFromJsonQuery.new(json_query).to_soql_parts['$group']
    correct_soql = %{moar_things,thingies__sum}
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  private
  def failure_message(expected, actual)
    [
      "expected: #{expected}",
      "  actual: #{actual}"
    ].join($/)
  end
end

class SoqlFromConditionsTest < Test::Unit::TestCase
  def setup
    init_current_domain
    load_sample_data('test/fixtures/sample-data.json')
    @view = View.find('test-data')
  end

  def test_to_soql
    merged_conditions = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [
        { 'columnId' => 48,
          'type' => 'column' },
        { 'columnId' => 47,
          'type' => 'column' }
      ]
      hashie.orderBys = [
        { 'expression' => { 'columnFieldName' => 'thingies' },
          'ascending' => false
        }
      ]
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'STARTS_WITH',
        'children' => [
          { 'type' => 'column',
            'columnFieldName' => 'things'},
          { 'type' => 'literal',
            'value' => '2' }
      ]}
    end

    @view.stubs(query: merged_conditions)
    soql = SoqlFromConditions.process(@view)
    correct_soql = %{$group=old_age,thingies&$order=thingies desc&$where=(starts_with(things,2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    @view.columns.find { |c| c.id == 48 }.stubs({
      has_group_function?: true,
      format: Hashie::Mash.new.tap { |hsh| hsh.group_function = 'date_ym' },
      renderTypeName: 'date'
    })
    soql = SoqlFromConditions.process(@view)
    correct_soql = %{$group=old_age,thingies__datez_trunc_ym&$order=thingies desc&$select=datez_trunc_ym(thingies) as thingies__datez_trunc_ym&$where=(starts_with(things,2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  def test_having_a_base_query
    @parent_view = View.find('test-data')
    @parent_view.stubs(id: 'pare-ntds')
    @view.stubs(parent_view: @parent_view)

    merged_conditions = Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [
        { 'columnId' => 48,
          'type' => 'column' },
        { 'columnId' => 47,
          'type' => 'column' }
      ]
      hashie.orderBys = [
        { 'expression' => { 'columnFieldName' => 'thingies' },
          'ascending' => false
        }
      ]
      hashie.filterCondition = {
        'type' => 'operator',
        'value' => 'STARTS_WITH',
        'children' => [
          { 'type' => 'column',
            'columnFieldName' => 'things'},
          { 'type' => 'literal',
            'value' => '2' }
      ]}
    end

    @view.stubs(query: merged_conditions)
    soql = SoqlFromConditions.process(@view)
    correct_soql = %{$group=old_age,thingies&$order=thingies desc&$where=(starts_with(things,2))}
    assert soql == correct_soql, failure_message(correct_soql, soql)

    @parent_view.stubs(query: Hashie::Mash.new.tap do |hashie|
      hashie.groupBys = [
        { 'columnId' => '48' }
      ]
    end)

    soql = SoqlFromConditions.process(@view)
    correct_soql = %{$order=thingies desc}
    assert soql == correct_soql, failure_message(correct_soql, soql)
  end

  private
  def failure_message(expected, actual)
    [
      "expected: #{expected}",
      "  actual: #{actual}"
    ].join($/)
  end
end
