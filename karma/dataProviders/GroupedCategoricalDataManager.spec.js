const _ = require('lodash');
const rewire = require('rewire');
const GroupedCategoricalDataManagerAPI = rewire('../../src/dataProviders/GroupedCategoricalDataManager');

const VALID_VIF_WITH_DIMENSION_GROUPING = {
  configuration: {
    showOtherCategory: false
  },
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  series: [
    {
      dataSource: {
        datasetUid: 'four-four',
        dimension: {
          columnName: 'blood_alcohol_level',
          aggregationFunction: null,
          grouping: {
            columnName: 'plausibility'
          }
        },
        domain: 'example.com',
        filters: [],
        limit: 5,
        measure: {
          columnName: null,
          aggregationFunction: 'count'
        },
        type: 'socrata.soql'
      },
      type: 'barChart'
    }
  ]
};
const MAX_ROW_COUNT = 1000;

describe('GroupedCategoricalDataManager', () => {

  describe('When not showing the "other" category', () => {
    const DIMENSION_VALUES_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_QUERY_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.5", "13"],
        ["0.49", "11"],
        ["0.48", "22"],
        ["0.47", "14"],
        ["0.46", "18"]
      ]
    };
    const GROUPING_VALUES_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ ASC LIMIT 12';
    const GROUPING_VALUES_QUERY_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["10", undefined], 
        ["9", undefined], 
        ["8", undefined], 
        ["7", undefined], 
        ["6", undefined], 
        ["5", undefined], 
        ["4", undefined], 
        ["3", undefined], 
        ["2", undefined], 
        ["1", undefined], 
      ]
    };

    let groupingQueryVifs;
    let revertGroupedCategoricalDataManagerAPI;

    beforeEach(() => {
      groupingQueryVifs = {
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"10"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"10","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"9"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"9","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"8"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"8","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"7"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"7","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"6","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"5"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"5","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"4"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"4","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"3"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"3","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"2"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"2","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"1"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"1","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"]
            ]
          },
          count: 0
        }
      };
      revertGroupedCategoricalDataManagerAPI = GroupedCategoricalDataManagerAPI.__set__(
        {
          SoqlDataProvider: function() {

            this.query = function(queryString) {

              switch (decodeURIComponent(queryString.trim())) {

                case DIMENSION_VALUES_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_QUERY_DATA);

                case GROUPING_VALUES_QUERY:
                  return Promise.resolve(GROUPING_VALUES_QUERY_DATA);

                default:
                  return Promise.reject(`Unrecognized query: "${decodeURIComponent(queryString.trim())}".`);
              }
            };
          },
          makeSocrataCategoricalDataRequest: function(vif, seriesIndex, maxRowCount) {
            const vifForQuery = JSON.stringify(vif);

            let stringifiedGroupingQueryVif;
            let queryResponse = false;

            for (stringifiedGroupingQueryVif in groupingQueryVifs) {
              const groupingQueryVif = JSON.parse(stringifiedGroupingQueryVif);

              if (_.isEqual(vif, groupingQueryVif)) {
                groupingQueryVifs[stringifiedGroupingQueryVif].count += 1;
                queryResponse = groupingQueryVifs[stringifiedGroupingQueryVif].response;
                break;
              }
            }
            
            if (queryResponse) {
              return queryResponse;
            } else {

              throw new Error(
                `Could not match vif against expected vifs for grouping queries: "${JSON.stringify(vif)}"`
              );
            }
          }
        }
      );
    });

    afterEach(() => {
      revertGroupedCategoricalDataManagerAPI();
    });

    it('returns the expected grouped data.', (done) => {
      const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);

      GroupedCategoricalDataManagerAPI.getData(
        vif,
        { MAX_ROW_COUNT: MAX_ROW_COUNT }
      ).
        then((response) => {
          const counts = Object.keys(groupingQueryVifs).map((groupingQueryVif) => {
            return groupingQueryVifs[groupingQueryVif].count;
          });

          // Assert that all vif queries were made exactly once
          assert.deepEqual(counts, counts.filter((count) => count === 1));
          // Make assertions about the 'data' that came back to see if it's in the right shape.
          assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1']);
          assert.equal(response.rows.length, 5);
          assert.deepEqual(response.rows[0], ['0.46', '18', '18', '18', '18', '18', '18', '18', '18', '18', '18']);
          assert.equal(response.rows[4][0], '0.5');

          done();
        }).
        catch((error) => {

          console.error(error);
          throw error;
        });
    });
  });

  describe('when showing the "other" category', () => {
    const DIMENSION_VALUES_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_QUERY_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.5", "13"],
        ["0.49", "11"],
        ["0.48", "22"],
        ["0.47", "14"],
        ["0.46", "18"]
      ]
    };
    const GROUPING_VALUES_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ ASC LIMIT 5';
    const GROUPING_VALUES_QUERY_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["10", undefined], 
        ["9", undefined],
        ["8", undefined],
        ["7", undefined],
        ["6", undefined]
      ]
    };

    let groupingQueryVifs;
    let revertGroupedCategoricalDataManagerAPI;

    beforeEach(() => {
      groupingQueryVifs = {
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"10"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"10","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"9"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"9","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"8"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"8","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"7"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"7","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"6","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["0.49", "11"],
              ["0.48", "22"],
              ["0.47", "14"],
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.5"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.5", "13"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.49"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.49", "11"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.48"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.48", "22"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.47"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.47", "14"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        },
        '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.46"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
          response: {
            columns: ['__dimension_alias__', '__measure_alias__'],
            rows: [
              ["0.46", "18"],
              ["(Other)", "100"]
            ]
          },
          count: 0
        }
      };
      revertGroupedCategoricalDataManagerAPI = GroupedCategoricalDataManagerAPI.__set__(
        {
          SoqlDataProvider: function() {

            this.query = function(queryString) {

              switch (decodeURIComponent(queryString.trim())) {

                case DIMENSION_VALUES_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_QUERY_DATA);

                case GROUPING_VALUES_QUERY:
                  return Promise.resolve(GROUPING_VALUES_QUERY_DATA);

                default:
                  return Promise.reject(`Unrecognized query: "${decodeURIComponent(queryString.trim())}".`);
              }
            };
          },
          makeSocrataCategoricalDataRequest: function(vif, seriesIndex, maxRowCount) {
            const vifForQuery = JSON.stringify(vif);

            let stringifiedGroupingQueryVif;
            let queryResponse = false;

            for (stringifiedGroupingQueryVif in groupingQueryVifs) {
              const groupingQueryVif = JSON.parse(stringifiedGroupingQueryVif);

              if (_.isEqual(vif, groupingQueryVif)) {
                groupingQueryVifs[stringifiedGroupingQueryVif].count += 1;
                queryResponse = groupingQueryVifs[stringifiedGroupingQueryVif].response;
                break;
              }
            }
            
            if (queryResponse) {
              return queryResponse;
            } else {

              throw new Error(
                `Could not match vif against expected vifs for grouping queries: "${JSON.stringify(vif)}"`
              );
            }
          },
          MAX_GROUP_COUNT: 5
        }
      );
    });

    afterEach(() => {
      revertGroupedCategoricalDataManagerAPI();
    });

    it('returns the expected grouped data.', (done) => {
      const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
      vif.configuration.showOtherCategory = true;

      GroupedCategoricalDataManagerAPI.getData(
        vif,
        { MAX_ROW_COUNT: MAX_ROW_COUNT }
      ).
        then((response) => {
          const counts = Object.keys(groupingQueryVifs).map((groupingQueryVif) => {
            return groupingQueryVifs[groupingQueryVif].count;
          });

          // Assert that all vif queries were made exactly once
          assert.deepEqual(counts, counts.filter((count) => count === 1));
          // Make assertions about the 'data' that came back to see if it's in the right shape.
          assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '(Other)']);
          assert.equal(response.rows.length, 6);
          assert.deepEqual(response.rows[0], ['(Other)', '100', '100', '100', '100', '100', null]);
          assert.equal(response.rows[4][0], '0.49');

          done();
        }).
        catch((error) => {

          console.error(error);
          throw error;
        });
    });
  });
});
