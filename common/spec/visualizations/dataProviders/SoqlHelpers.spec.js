import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';

describe('SoqlHelpers', function() {

  var TEST_OWN_COLUMN_NAME = 'test_column';
  var TEST_OWN_COMPUTED_COLUMN_NAME = ':@test_computed_column';
  var TEST_OTHER_COLUMN_NAME = 'test_other_column';
  var TEST_OTHER_COMPUTED_COLUMN_NAME = ':@test_other_computed_column';

  var BINARY_OPERATOR_PATTERN = '`{0}` = \'test value\'';
  var BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN = '`{0}` = \'22\'';
  var IS_NULL_TRUE_PATTERN = '`{0}` IS NULL';
  var IS_NULL_FALSE_PATTERN = '`{0}` IS NOT NULL';
  var TIME_RANGE_PATTERN = '`{0}` >= \'2015-09-11T10:17:18\' AND `{0}` < \'2015-09-12T10:17:18\'';
  var VALUE_RANGE_PATTERN = '`{0}` >= 0 AND `{0}` < 100';

  /**
   * The following functions generate a vif and individual filters to make the
   * actual test code a little easier to write.
   */

  function vifWithNoFilters() {
    return {
      configuration: {},
      description: null,
      series: [
        {
          dataSource: {
            datasetUid: 'test-test',
            dimension: {
              columnName: TEST_OWN_COLUMN_NAME,
              aggregationFunction: null
            },
            domain: 'example.com',
            measure: {
              columnName: null,
              aggregationFunction: 'count'
            },
            type: 'socrata.soql',
            filters: []
          },
          label: null,
          type: 'timelineChart'
        }
      ],
      createdAt: '2015-09-11T10:17:18',
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      title: null
    };
  }

  function testBinaryOperatorFilter(filterOwnColumn) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'binaryOperator',
      'arguments': {
        'operator': '=',
        'operand': 'test value'
      }
    };
  }

  function testBinaryComputedGeoregionOperatorFilter(filterOwnColumn) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'binaryComputedGeoregionOperator',
      'arguments': {
        'operator': '=',
        'operand': '22',
        'humanReadableOperand': 'Louisiana',
        'computedColumnName': (filterOwnColumn) ?
          TEST_OWN_COMPUTED_COLUMN_NAME :
          TEST_OTHER_COMPUTED_COLUMN_NAME
      }
    };
  }

  function testIsNullFilter(filterOwnColumn, isNull) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'isNull',
      'arguments': {
        'isNull': isNull
      }
    };
  }

  function testTimeRangeFilter(filterOwnColumn) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'timeRange',
      'arguments': {
        'start': '2015-09-11T10:17:18',
        'end': '2015-09-12T10:17:18'
      }
    };
  }

  function testValueRangeFilter(filterOwnColumn) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'valueRange',
      'arguments': {
        'start': 0,
        'end': 100
      }
    };
  }

  function testNoopFilter(filterOwnColumn) {
    return {
      'columnName': (filterOwnColumn) ?
        TEST_OWN_COLUMN_NAME :
        TEST_OTHER_COLUMN_NAME,
      'function': 'noop',
      'arguments': null
    };
  }

  /**
   * The following functions match where clause components to make the actual
   * test code a little easier to follow.
   */

  function matchOwnColumnBinaryOperatorFilter(whereClause) {
    return whereClause.match(new RegExp(BINARY_OPERATOR_PATTERN.format(TEST_OWN_COLUMN_NAME))) !== null;
  }

  function matchOtherColumnBinaryOperatorFilter(whereClause) {
    return whereClause.match(new RegExp(BINARY_OPERATOR_PATTERN.format(TEST_OTHER_COLUMN_NAME))) !== null;
  }

  function matchOwnColumnBinaryComputedGeoregionOperatorFilter(whereClause) {
    return (
      whereClause.match(
        new RegExp(
          BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN.format(TEST_OWN_COMPUTED_COLUMN_NAME)
        )
      ) !== null
    );
  }

  function matchOtherColumnBinaryComputedGeoregionOperatorFilter(whereClause) {
    return (
      whereClause.match(
        new RegExp(
          BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN.format(TEST_OTHER_COMPUTED_COLUMN_NAME)
        )
      ) !== null
    );
  }

  function matchOwnColumnIsNullFalseFilter(whereClause) {
    return whereClause.match(new RegExp(IS_NULL_FALSE_PATTERN.format(TEST_OWN_COLUMN_NAME))) !== null;
  }

  function matchOtherColumnIsNullFalseFilter(whereClause) {
    return whereClause.match(new RegExp(IS_NULL_FALSE_PATTERN.format(TEST_OTHER_COLUMN_NAME))) !== null;
  }

  function matchOwnColumnIsNullTrueFilter(whereClause) {
    return whereClause.match(new RegExp(IS_NULL_TRUE_PATTERN.format(TEST_OWN_COLUMN_NAME))) !== null;
  }

  function matchOtherColumnIsNullTrueFilter(whereClause) {
    return whereClause.match(new RegExp(IS_NULL_TRUE_PATTERN.format(TEST_OTHER_COLUMN_NAME))) !== null;
  }

  function matchOwnColumnTimeRangeFilter(whereClause) {
    return whereClause.match(new RegExp(TIME_RANGE_PATTERN.format(TEST_OWN_COLUMN_NAME))) !== null;
  }

  function matchOtherColumnTimeRangeFilter(whereClause) {
    return whereClause.match(new RegExp(TIME_RANGE_PATTERN.format(TEST_OTHER_COLUMN_NAME))) !== null;
  }

  function matchOwnColumnValueRangeFilter(whereClause) {
    return whereClause.match(new RegExp(VALUE_RANGE_PATTERN.format(TEST_OWN_COLUMN_NAME))) !== null;
  }

  function matchOtherColumnValueRangeFilter(whereClause) {
    return whereClause.match(new RegExp(VALUE_RANGE_PATTERN.format(TEST_OTHER_COLUMN_NAME))) !== null;
  }

  /**
   * This function iterates over collections of filters and matching rules to
   * test for where clause components' presence or absence in bulk.
   */
  function testFilterAndMatchSets(filterSets, matchSets, filterOwnColumn) {
    var vif = vifWithNoFilters();
    var whereClause;

    filterSets.forEach(function(filterSet, i) {
      var matchSet = matchSets[i];

      vif.series[0].dataSource.filters = filterSet;

      if (filterOwnColumn) {
        whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0);
      } else {
        whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
      }

      matchSet.forEach(function(match) {

        if (match.expectedValue === true) {
          assert.isTrue(
            match.matcher(whereClause),
            'Expected where clause "{0}" to match pattern "{1}"'.format(
              whereClause,
              match.pattern.format(match.column)
            )
          );
        } else {
          assert.isFalse(
            match.matcher(whereClause),
            'Expected where clause "{0}" to not match pattern "{1}"'.format(
              whereClause,
              match.pattern.format(match.column)
            )
          );
        }
      });
    });

  }

  describe('aggregationClause', function() {

    it('returns a count aggregation clause when the measure aggregation function is `count`', function() {
      var vif = vifWithNoFilters();

      assert.equal(SoqlHelpers.aggregationClause(vif, 0, 'measure'), 'COUNT(*)');
    });

    it('returns a sum aggregation clause when the measure aggregation function is `sum`', function() {
      var vif = vifWithNoFilters();
      vif.series[0].dataSource.measure.columnName = 'aggregation_column';
      vif.series[0].dataSource.measure.aggregationFunction = 'sum';

      assert.equal(SoqlHelpers.aggregationClause(vif, 0, 'measure'), 'SUM(`aggregation_column`)');
    });
  });

  describe('whereClauseNotFilteringOwnColumn', function() {

    it('returns an empty string when the only filter is on its own column', function() {
      var vif = vifWithNoFilters();
      var filterSets = [
        [testBinaryOperatorFilter(true)],
        [testBinaryComputedGeoregionOperatorFilter(true)],
        [testIsNullFilter(true, false)],
        [testIsNullFilter(true, true)],
        [testTimeRangeFilter(true)],
        [testValueRangeFilter(true)]
      ];
      var whereClause;

      filterSets.forEach(function(filterSet) {

        vif.series[0].filters = filterSet;
        whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, '');
      });
    });

    it('returns a where clause when the only filter is on some other column', function() {
      var filterSets = [
        [testBinaryOperatorFilter(false)],
        [testBinaryComputedGeoregionOperatorFilter(false)],
        [testIsNullFilter(false, false)],
        [testIsNullFilter(false, true)],
        [testTimeRangeFilter(false)],
        [testValueRangeFilter(false)]
      ];

      var matchSets = [
        [
          {
            matcher: matchOwnColumnBinaryOperatorFilter,
            expectedValue: false,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: false,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OWN_COMPUTED_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OTHER_COMPUTED_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnIsNullFalseFilter,
            expectedValue: false,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnIsNullTrueFilter,
            expectedValue: false,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnTimeRangeFilter,
            expectedValue: false,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnValueRangeFilter,
            expectedValue: false,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ]
      ];

      testFilterAndMatchSets(filterSets, matchSets, false);
    });

    it('returns a where clause containing only components for other columns when there are filters on its own and other columns', function() {
      var filterSets = [
        [testBinaryOperatorFilter(true), testBinaryOperatorFilter(false)],
        [testBinaryComputedGeoregionOperatorFilter(true), testBinaryComputedGeoregionOperatorFilter(false)],
        [testIsNullFilter(true, false), testIsNullFilter(false, false)],
        [testIsNullFilter(true, true), testIsNullFilter(false, true)],
        [testTimeRangeFilter(true), testTimeRangeFilter(false)],
        [testValueRangeFilter(true), testValueRangeFilter(false)]
      ];

      var matchSets = [
        [
          {
            matcher: matchOwnColumnBinaryOperatorFilter,
            expectedValue: false,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: false,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OWN_COMPUTED_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OTHER_COMPUTED_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullFalseFilter,
            expectedValue: false,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullTrueFilter,
            expectedValue: false,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnTimeRangeFilter,
            expectedValue: false,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnValueRangeFilter,
            expectedValue: false,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ]
      ];

      testFilterAndMatchSets(filterSets, matchSets, false);
    });

    it('ignores noop filters', function() {
      var vif = vifWithNoFilters();

      vif.series[0].filters = [testNoopFilter(true), testNoopFilter(false)];

      var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);

      expect(whereClause).to.equal('');
    });

    describe('when a binaryOperatorFilter has a joinOn property', function() {
      it('throws with an invalid joinOn property', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OTHER_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'BROKEN'
        }];

        assert.throws(() => { SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0); });
      });

      it('joins binaryOperatorFilters using OR when joinOn is not set', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OTHER_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ]
        }];

        var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OTHER_COLUMN_NAME}\` = 'test' OR \`${TEST_OTHER_COLUMN_NAME}\` IS NULL )`);
      });

      it('joins binaryOperatorFilters using OR when joinOn = "OR"', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OTHER_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'OR'
        }];

        var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OTHER_COLUMN_NAME}\` = 'test' OR \`${TEST_OTHER_COLUMN_NAME}\` IS NULL )`);
      });

      it('joins binaryOperatorFilters using AND when joinOn = "AND"', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OTHER_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'AND'
        }];

        var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OTHER_COLUMN_NAME}\` = 'test' AND \`${TEST_OTHER_COLUMN_NAME}\` IS NULL )`);
      });
    });
  });

  describe('whereClauseFilteringOwnColumn', function() {
    it('returns a where clause when the only filter is on its own column', function() {
      var filterSets = [
        [testBinaryOperatorFilter(true)],
        [testBinaryComputedGeoregionOperatorFilter(true)],
        [testIsNullFilter(true, false)],
        [testIsNullFilter(true, true)],
        [testTimeRangeFilter(true)],
        [testValueRangeFilter(true)]
      ];
      var matchSets = [
        [
          {
            matcher: matchOwnColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryOperatorFilter,
            expectedValue: false,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OWN_COMPUTED_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: false,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OTHER_COMPUTED_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullFalseFilter,
            expectedValue: false,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullTrueFilter,
            expectedValue: false,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnTimeRangeFilter,
            expectedValue: false,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnValueRangeFilter,
            expectedValue: false,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ]
      ];

      testFilterAndMatchSets(filterSets, matchSets, true);
    });

    it('returns a where clause when the only filter is on some other column', function() {
      var filterSets = [
        [testBinaryOperatorFilter(false)],
        [testBinaryComputedGeoregionOperatorFilter(false)],
        [testIsNullFilter(false, false)],
        [testIsNullFilter(false, true)],
        [testTimeRangeFilter(false)],
        [testValueRangeFilter(false)]
      ];
      var matchSets = [
        [
          {
            matcher: matchOwnColumnBinaryOperatorFilter,
            expectedValue: false,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: false,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OWN_COMPUTED_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OTHER_COMPUTED_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullFalseFilter,
            expectedValue: false,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullTrueFilter,
            expectedValue: false,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnTimeRangeFilter,
            expectedValue: false,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnValueRangeFilter,
            expectedValue: false,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ]
      ];

      testFilterAndMatchSets(filterSets, matchSets, true);
    });

    it('returns a where clause containing all components when there are filters on its own and other columns', function() {
      var filterSets = [
        [testBinaryOperatorFilter(true), testBinaryOperatorFilter(false)],
        [testBinaryComputedGeoregionOperatorFilter(true), testBinaryComputedGeoregionOperatorFilter(false)],
        [testIsNullFilter(true, false), testIsNullFilter(false, false)],
        [testIsNullFilter(true, true), testIsNullFilter(false, true)],
        [testTimeRangeFilter(true), testTimeRangeFilter(false)],
        [testValueRangeFilter(true), testValueRangeFilter(false)]
      ];
      var matchSets = [
        [
          {
            matcher: matchOwnColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryOperatorFilter,
            expectedValue: true,
            pattern: BINARY_OPERATOR_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OWN_COMPUTED_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnBinaryComputedGeoregionOperatorFilter,
            expectedValue: true,
            pattern: BINARY_COMPUTED_GEOREGION_OPERATOR_PATTERN,
            column: TEST_OTHER_COMPUTED_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullFalseFilter,
            expectedValue: true,
            pattern: IS_NULL_FALSE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnIsNullTrueFilter,
            expectedValue: true,
            pattern: IS_NULL_TRUE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],

        [
          {
            matcher: matchOwnColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnTimeRangeFilter,
            expectedValue: true,
            pattern: TIME_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ],
        [
          {
            matcher: matchOwnColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OWN_COLUMN_NAME
          },
          {
            matcher: matchOtherColumnValueRangeFilter,
            expectedValue: true,
            pattern: VALUE_RANGE_PATTERN,
            column: TEST_OTHER_COLUMN_NAME
          }
        ]
      ];

      testFilterAndMatchSets(filterSets, matchSets, true);
    });

    it('ignores noop filters', function() {
      var vif = vifWithNoFilters();

      vif.series[0].filters = [testNoopFilter(true), testNoopFilter(false)];

      var whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0);

      expect(whereClause).to.equal('');
    });

    describe('when a binaryOperatorFilter has a joinOn property', function() {
      it('throws with an invalid joinOn property', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OTHER_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'BROKEN'
        }];

        assert.throws(() => { SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0); });
      });

      it('joins binaryOperatorFilters using OR when joinOn is not set', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OWN_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ]
        }];

        var whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OWN_COLUMN_NAME}\` = 'test' OR \`${TEST_OWN_COLUMN_NAME}\` IS NULL )`);
      });

      it('joins binaryOperatorFilters using OR when joinOn = "OR"', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OWN_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'OR'
        }];

        var whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OWN_COLUMN_NAME}\` = 'test' OR \`${TEST_OWN_COLUMN_NAME}\` IS NULL )`);
      });

      it('joins binaryOperatorFilters using AND when joinOn = "AND"', function() {
        var vif = vifWithNoFilters();

        vif.series[0].dataSource.filters = [{
          'function': 'binaryOperator',
          'columnName': TEST_OWN_COLUMN_NAME,
          'arguments': [
            {
              'operator': '=',
              'operand': 'test'
            },
            {
              'operator': 'IS NULL'
            }
          ],
          'joinOn': 'AND'
        }];

        var whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif, 0);

        assert.equal(whereClause, `(\`${TEST_OWN_COLUMN_NAME}\` = 'test' AND \`${TEST_OWN_COLUMN_NAME}\` IS NULL )`);
      });
    });
  });

  describe('orderByClauseFromSeries', () => {
    function buildVifWithOrderBy(parameter, sort) {
      return {
        series: [
          {
            dataSource: {
              orderBy: {
                parameter,
                sort
              }
            }
          }
        ]
      };
    }

    function returnsOrderByClauseWith(parameter, sort) {
      const sqlSort = _.upperCase(sort);
      const sqlAlias = parameter === 'dimension' ?
        SoqlHelpers.dimensionAlias() :
        SoqlHelpers.measureAlias();


      describe(`when orderBy is a ${parameter} and ${sort}`, () => {
        it(`returns the ${parameter} alias and SQL ${sqlSort} as a string`, () => {
          const vif = buildVifWithOrderBy(parameter, sort);
          const orderBy = SoqlHelpers.orderByClauseFromSeries(vif, 0);
          expect(orderBy).to.equal(`${sqlAlias} ${sqlSort}`);
        });
      });
    }

    describe('when parameter is set incorrectly', () => {
      it('throws', () => {
        const vif = buildVifWithOrderBy('yours is the first face that I saw', 'asc');

        expect(() => {
          SoqlHelpers.orderByClauseFromSeries(vif, 0);
        }).to.throw;
      });
    });

    describe('when sort is set incorrectly', () => {
      const vif = buildVifWithOrderBy('measure', 'first day of my life');

      it('throws', () => {
        expect(() => {
          SoqlHelpers.orderByClauseFromSeries(vif, 0);
        }).to.throw;
      });
    });

    describe('when orderBy isn\'t set', () => {
      it('returns the measure alias and SQL DESC as a string', () => {
        const vif = buildVifWithOrderBy();

        _.set(vif, 'series[0].dataSource.measure.aggregationFunction', null);
        _.set(vif, 'series[0].dataSource.dimension.aggregationFunction', null);
        _.unset(vif, 'series[0].dataSource.orderBy');

        const orderBy = SoqlHelpers.orderByClauseFromSeries(vif, 0);

        expect(orderBy).to.equal(`${SoqlHelpers.measureAlias()} DESC`);
      });
    });

    returnsOrderByClauseWith('measure', 'asc');
    returnsOrderByClauseWith('measure', 'desc');
    returnsOrderByClauseWith('dimension', 'asc');
    returnsOrderByClauseWith('dimension', 'desc');
  });
});
