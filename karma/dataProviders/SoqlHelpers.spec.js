var rewire = require('rewire');
var SoqlHelpers = rewire('../../src/dataProviders/SoqlHelpers');

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
      'aggregation': {
        'columnName': 'column_name',
        'function': 'sum'
      },
      'columnName': TEST_OWN_COLUMN_NAME,
      'configuration': {
      },
      'createdAt': '2015-09-11T10:17:18',
      'datasetUid': 'test-test',
      'description': 'Test description',
      'domain': 'dataspace.demo.socrata.com',
      'filters': [],
      'format': {
        'type': 'visualization_interchange_format',
        'version': 1
      },
      'origin': {
        'type': 'data_lens_export',
        'url': 'https://dataspace.demo.socrata.com/view/four-four'
      },
      'title': 'Test title',
      'type': 'columnChart',
      'unit': {
        'one': 'case',
        'other': 'cases'
      }
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

      vif.filters = filterSet;

      if (filterOwnColumn) {
        whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(vif);
      } else {
        whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif);
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

  describe('whereClauseNotFilteringOwnColumn', function() {

    it('returns an empty string when the only filter is on its own column', function() {
      var vif = vifWithNoFilters();
      var filterSets = [
        [testBinaryOperatorFilter(true)],
        [testBinaryComputedGeoregionOperatorFilter(true)],
        [testIsNullFilter(true, false)],
        [testIsNullFilter(true, true)],
        [testTimeRangeFilter(true)],
        [testValueRangeFilter(true)],
      ];
      var whereClause;

      filterSets.forEach(function(filterSet) {

        vif.filters = filterSet;
        whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif);
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
        [testValueRangeFilter(false)],
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
        ],
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
        [testValueRangeFilter(true), testValueRangeFilter(false)],
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
        ],
      ];

      testFilterAndMatchSets(filterSets, matchSets, false);
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
        [testValueRangeFilter(true)],
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
        ],
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
        [testValueRangeFilter(false)],
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
        ],
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
        [testValueRangeFilter(true), testValueRangeFilter(false)],
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
        ],
      ];

      testFilterAndMatchSets(filterSets, matchSets, true);
    });
  });
});
