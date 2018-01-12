require 'rails_helper'
require 'soql_duct_tape'

describe ConditionsQueryParser do
  include TestHelperMethods

  let(:sample_data) { json_fixture('sample-data.json') }
  let(:sample_parent_data) { sample_data.merge(id: 'pare-ntds') }

  # generate a View that overrides the sample data fixture in specific ways.
  # it's a pain to do this because you can't use stubs and trying to modify an
  # existing View doesn't always work as you might expect.
  def generate_view(partial_data = {}, from_parent = false)
    source = if from_parent then sample_parent_data else sample_data end
    View.new(source.deep_merge(partial_data.with_indifferent_access))
  end

  def json_query(view)
    ConditionsQueryParser::JsonQueryFromDataset.new(view)
  end

  def query(json_query, base_json_query = nil)
    ConditionsQueryParser::Query.new(json_query, base_json_query)
  end

  describe ConditionsQueryParser::JsonQueryFromDataset do
    it 'test_search_string' do
      search_string = 'some search string'

      view = generate_view
      view.searchString = search_string

      expect(json_query(view).search).to eq(search_string)
    end

    it 'test_order_bys' do
      # CASE 1

      view = generate_view({
        query: {
          orderBys: [
            { ascending: false, expression: { columnId: 48, type: "column" } }
          ]
        }
      })

      expect(json_query(view).order).to eq([
        { 'columnFieldName' => 'thingies', 'ascending' => false }
      ])

      # CASE 2

      view = generate_view({
        query: {
          orderBys: [
            { ascending: true, expression: { columnId: 48, type: "column" } }
          ]
        }
      })

      expect(json_query(view).order).to eq([
        { 'columnFieldName' => 'thingies', 'ascending' => true }
      ])

      # CASE 3

      view = generate_view({
        query: {
          orderBys: [
            { ascending: false, expression: { columnId: 48, type: "column" } },
            { ascending: true, expression: { columnId: 49, type: "column" } }
          ]
        }
      })

      expect(json_query(view).order).to eq([
        { 'columnFieldName' => 'thingies', 'ascending' => false },
        { 'columnFieldName' => 'moar_things', 'ascending' => true }
      ])
    end

    it 'test_group_bys' do
      # CASE 1

      view = generate_view({
        query: {
          groupBys: [
            { columnId: 48, type: "column" }
          ]
        }
      })

      expect(json_query(view).group.collect(&:to_hash)).to eq([
        { 'columnFieldName' => 'thingies' }
      ])

      # CASE 2

      view = generate_view({
        query: {
          groupBys: [
            { columnId: 48, type: "column" },
            { columnId: 49, type: "column" }
          ]
        }
      })

      expect(json_query(view).group.collect(&:to_hash)).to eq([
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies' }
      ])

      # CASE 3

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['format']['group_function'] = 'sum'
        end

        column
      end

      view = generate_view({
        columns: columns,
        query: {
          groupBys: [
            { columnId: 48, type: "column" },
            { columnId: 49, type: "column" }
          ]
        }
      })

      expect(json_query(view).group.collect(&:to_hash)).to eq([
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies', 'groupFunction' => 'sum' }
      ])

      # CASE 4

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['format']['group_function'] = 'date_ym'
          column['renderTypeName'] = 'date'
        end

        column
      end

      view = generate_view({
        columns: columns,
        query: {
          groupBys: [
            { columnId: 48, type: "column" },
            { columnId: 49, type: "column" }
          ]
        }
      })

      expect(json_query(view).group.collect(&:to_hash)).to eq([
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies', 'groupFunction' => 'datez_trunc_ym' }
      ])

      # CASE 5

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['format']['group_function'] = 'date_ym'
          column['renderTypeName'] = 'calendar_date'
        end

        column
      end

      view = generate_view({
        columns: columns,
        query: {
          groupBys: [
            { columnId: 48, type: "column" },
            { columnId: 49, type: "column" }
          ]
        }
      })

      expect(json_query(view).group.collect(&:to_hash)).to eq([
        { 'columnFieldName' => 'moar_things' },
        { 'columnFieldName' => 'thingies', 'groupFunction' => 'date_trunc_ym' }
      ])
    end

    it 'test_split_filter_conditions_into_where_and_having' do
      # CASE 1

      view = generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'BETWEEN',
            'children' => [
              { 'type' => 'column', 'columnId' => 48 },
              { 'type' => 'literal', 'value' => '1' },
              { 'type' => 'literal', 'value' => '5' }
            ]
          }
        }
      })

      expect(json_query(view).where).to eq({
        'columnFieldName' => 'thingies',
        'value' => ['1', '5'],
        'operator' => 'BETWEEN'
      })
      expect(json_query(view).having).to be_nil

      # CASE 2

      view = generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 44 },
              { 'type' => 'literal', 'value' => 'Green' }
            ]
          }
        }
      })

      expect(json_query(view).where).to eq({
        'columnFieldName' => 'color',
        'value' => 'Green',
        'operator' => 'EQUALS'
      })
      expect(json_query(view).having).to be_nil

      # CASE 3

      view = generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 44 },
              { 'type' => 'literal', 'value' => 'Green' }
            ]
          },
          groupBys: [
            { columnId: 48, type: "column" }
          ]
        }
      })

      expect(json_query(view).where).to eq({
        'columnFieldName' => 'color',
        'value' => 'Green',
        'operator' => 'EQUALS'
      })
      expect(json_query(view).having).to be_nil

      # CASE 4

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['is_grouping_aggregate'] = true
          column['format']['grouping_aggregate'] = 'maximum'
        end

        column
      end

      view = generate_view({
        columns: columns,
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 48 },
              { 'type' => 'literal', 'value' => '5' }
            ]
          },
          groupBys: [
            { columnId: 48, type: "column" }
          ]
        }
      })

      expect(json_query(view).having).to eq({
        'columnFieldName' => 'max_thingies',
        'value' => '5',
        'operator' => 'EQUALS'
      })
      expect(json_query(view).where).to be_nil

      # CASE 5

      view = generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 44 },
              { 'type' => 'literal', 'value' => 'Green' }
            ]
          },
          groupBys: [
            { columnId: 44, type: "column" }
          ]
        }
      })

      expect(json_query(view).having).to eq({
        'columnFieldName' => 'color',
        'value' => 'Green',
        'operator' => 'EQUALS'
      })
      expect(json_query(view).where).to be_nil

      # CASE 6

      view = generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'AND',
            'children' => [
              {
                'type' => 'operator',
                'value' => 'EQUALS',
                'children' => [
                  { 'type' => 'column', 'columnId' => 44 },
                  { 'type' => 'literal', 'value' => 'Green' }
                ]
              },
              {
                'type' => 'operator',
                'value' => 'EQUALS',
                'children' => [
                  { 'type' => 'column', 'columnId' => 48 },
                  { 'type' => 'literal', 'value' => '5' }
                ]
              }
            ]
          },
          groupBys: [
            { columnId: 44, type: "column" }
          ]
        }
      })

      expect(json_query(view).where).to eq({
        'operator' => 'AND',
        'children' => [{
          'columnFieldName' => 'thingies',
          'value' => '5',
          'operator' => 'EQUALS'
        }]
      })
      expect(json_query(view).having).to eq({
        'operator' => 'AND',
        'children' => [{
          'columnFieldName' => 'color',
          'value' => 'Green',
          'operator' => 'EQUALS'
        }]
      })
    end
  end

  describe ConditionsQueryParser::Query do
    it 'test_search' do
      search_string = 'some search string'

      # CASE 1

      view = generate_view
      view.searchString = search_string
      jq = json_query(view)

      expect(query(jq).to_soql).to eq("$search=#{search_string}")

      # CASE 2

      bjq = json_query(generate_view({}, true))

      expect(query(jq, bjq).to_soql).to eq("$search=#{search_string}")
    end

    it 'test_order' do
      # CASE 1

      jq = json_query(generate_view({
        query: {
          orderBys: [
            { ascending: false, expression: { columnId: 48, type: "column" } }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$order']).to eq('thingies desc')

      # CASE 2

      jq = json_query(generate_view({
        query: {
          orderBys: [
            { ascending: true, expression: { columnId: 48, type: "column" } }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$order']).to eq('thingies')

      # CASE 3

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['format']['grouping_aggregate'] = 'sum'
          column['renderTypeName'] = 'date'
        end

        column
      end

      jq = json_query(generate_view({
        columns: columns,
        query: {
          orderBys: [
            { ascending: false, expression: { columnId: 48, type: "column" } }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$order']).to eq('sum(thingies) desc')
    end

    it 'test_filter_clause' do
      # CASE 1

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 44 },
              { 'type' => 'literal', 'value' => 'Green' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(UPPER(color)=UPPER('Green'))})

      # CASE 2

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 46 },
              { 'type' => 'literal', 'value' => '5' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(things=5)})

      # CASE 3

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'GREATER_THAN',
            'children' => [
              { 'type' => 'column', 'columnId' => 46 },
              { 'type' => 'literal', 'value' => '5' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(things>5)})

      # CASE 4

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'IS_NOT_BLANK',
            'children' => [
              { 'type' => 'column', 'columnId' => 44 }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(color is not null)})

      # CASE 5

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'AND',
            'children' => [
              {
                'type' => 'operator',
                'value' => 'EQUALS',
                'children' => [
                  { 'type' => 'column', 'columnId' => 44 },
                  { 'type' => 'literal', 'value' => 'Green' }
                ]
              },
              {
                'type' => 'operator',
                'value' => 'EQUALS',
                'children' => [
                  { 'type' => 'column', 'columnId' => 46 },
                  { 'type' => 'literal', 'value' => '5' }
                ]
              }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{((UPPER(color)=UPPER('Green')) AND (things=5))})

      # CASE 6

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'BETWEEN',
            'children' => [
              { 'type' => 'column', 'columnId' => 46 },
              { 'type' => 'literal', 'value' => '1' },
              { 'type' => 'literal', 'value' => '5' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(things>=1 AND things<=5)})

      # CASE 7

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'STARTS_WITH',
            'children' => [
              { 'type' => 'column', 'columnId' => 46 },
              { 'type' => 'literal', 'value' => '2' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(starts_with(things,2))})

      # CASE 8

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'NOT_CONTAINS',
            'children' => [
              { 'type' => 'column', 'columnId' => 46 },
              { 'type' => 'literal', 'value' => '2' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(not contains(things,2))})

      # CASE 9

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'IS_BLANK',
            'children' => [
              { 'type' => 'column', 'columnId' => 50 }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(not chechechecheckbox)})

      # CASE 10

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'IS_NOT_BLANK',
            'children' => [
              { 'type' => 'column', 'columnId' => 50 }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(chechechecheckbox)})

      # CASE 11

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'IS_NOT_BLANK',
            'children' => [
              { 'type' => 'column', 'columnId' => 51 }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(you_are_a_star is not null)})

      # CASE 12

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'GREATER_THAN',
            'children' => [
              { 'type' => 'column', 'columnId' => 51 },
              { 'type' => 'literal', 'value' => '2' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(to_number(you_are_a_star)>2)})

      # CASE 13

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'GREATER_THAN',
            'children' => [
              { 'type' => 'column', 'columnId' => 52 },
              { 'type' => 'literal', 'value' => '2' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(all_the_monies>to_usd(2))})

      # CASE 14

      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'BETWEEN',
            'children' => [
              { 'type' => 'column', 'columnId' => 53 },
              { 'type' => 'literal', 'value' => '11/09/2015' },
              { 'type' => 'literal', 'value' => '12/31/2015' }
            ]
          }
        }
      }))

      expect(query(jq).to_soql_parts['$where']).to eq(%{(someday_sometime>='2015-11-09T00:00:00Z' AND someday_sometime<='2015-12-31T00:00:00Z')})
    end

    it 'test_having' do
      jq = json_query(generate_view({
        query: {
          filterCondition: {
            'type' => 'operator',
            'value' => 'EQUALS',
            'children' => [
              { 'type' => 'column', 'columnId' => 48 },
              { 'type' => 'literal', 'value' => '5' }
            ]
          },
          groupBys: [
            { columnId: 48, type: "column" }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$having']).to eq(%{(thingies=5)})
    end

    it 'test_group' do
      # CASE 1

      jq = json_query(generate_view({
        query: {
          groupBys: [
            { columnId: 48, type: "column" }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$group']).to eq(%{thingies})

      # CASE 2

      jq = json_query(generate_view({
        query: {
          groupBys: [
            { columnId: 49, type: "column" },
            { columnId: 48, type: "column" }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$group']).to eq(%{moar_things,thingies})

      # CASE 3

      columns = sample_data['columns'].map do |col|
        column = col.deep_dup
        if column['id'] == 48
          column['format']['group_function'] = 'sum'
        end

        column
      end

      jq = json_query(generate_view({
        columns: columns,
        query: {
          groupBys: [
            { columnId: 49, type: "column" },
            { columnId: 48, type: "column" }
          ]
        }
      }))

      expect(query(jq).to_soql_parts['$group']).to eq(%{moar_things,thingies__sum})
    end
  end

  it 'test_to_soql' do
    # CASE 1

    view = generate_view({
      query: {
        filterCondition: {
          'type' => 'operator',
          'value' => 'STARTS_WITH',
          'children' => [
            { 'type' => 'column', 'columnFieldName' => 'things'},
            { 'type' => 'literal', 'value' => '2' }
          ]
        },
        orderBys: [
          { ascending: false, expression: { columnId: 48, type: "column" } }
        ],
        groupBys: [
          { columnId: 48, type: "column" },
          { columnId: 47, type: "column" }
        ]
      }
    })

    expect(ConditionsQueryParser.parse(view).to_soql).to eq(
      %{$group=old_age,thingies&$order=thingies desc&$where=(starts_with(things,2))}
    )

    # CASE 2

    columns = sample_data['columns'].map do |col|
      column = col.deep_dup
      if column['id'] == 48
        column['format']['group_function'] = 'date_ym'
        column['renderTypeName'] = 'date'
      end

      column
    end

    view = generate_view({
      columns: columns,
      query: {
        filterCondition: {
          'type' => 'operator',
          'value' => 'STARTS_WITH',
          'children' => [
            { 'type' => 'column', 'columnFieldName' => 'things'},
            { 'type' => 'literal', 'value' => '2' }
          ]
        },
        orderBys: [
          { ascending: false, expression: { columnId: 48, type: "column" } }
        ],
        groupBys: [
          { columnId: 48, type: "column" },
          { columnId: 47, type: "column" }
        ]
      }
    })

    expect(ConditionsQueryParser.parse(view).to_soql).to eq(
      %{$group=old_age,thingies__datez_trunc_ym&$order=thingies desc&$select=datez_trunc_ym(thingies) as thingies__datez_trunc_ym&$where=(starts_with(things,2))}
    )
  end

end
