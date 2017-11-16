import _ from 'lodash';
import GroupedTimeDataManager, {
  __RewireAPI__ as GroupedTimeDataManagerAPI
} from 'common/visualizations/dataProviders/GroupedTimeDataManager';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';

const VALID_VIF_WITH_DIMENSION_GROUPING = {
  configuration: {},
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  series: [
    {
      dataSource: {
        datasetUid: 'four-four',
        dimension: {
          columnName: 'incident_occurrence',
          aggregationFunction: null,
          grouping: {
            columnName: 'blood_alcohol_level'
          }
        },
        domain: 'example.com',
        filters: [
          {
            arguments: {
              start: '2001-01-01T00:00:00.000',
              end: '2003-06-01T00:00:00.000'
            },
            columnName: 'incident_occurrence',
            function: 'timeRange'
          }
        ],
        measure: {
          columnName: null,
          aggregationFunction: 'count'
        },
        precision: 'month',
        type: 'socrata.soql'
      },
      type: 'timelineChart'
    }
  ],
  requireGroupingInSelect: true,
  groupingColumnName: 'blood_alcohol_level'
};
const MAX_ROW_COUNT = 1000;

describe('GroupedTimeDataManager', () => {
  const GROUPING_VALUES_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__ WHERE `incident_occurrence` >= \'2001-01-01T00:00:00.000\' AND `incident_occurrence` < \'2003-06-01T00:00:00.000\' GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC LIMIT 12';
  const GROUPING_VALUES_QUERY_DATA = {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ['0.01', undefined],
      ['0.02', undefined],
      ['0.03', undefined],
      ['0.04', undefined],
      ['0.05', undefined],
      ['0.06', undefined],
      ['0.07', undefined],
      ['0.08', undefined],
      ['0.09', undefined],
      ['0.1', undefined],
      ['0.11', undefined],
      ['Apostrophe\'s escaped', undefined]
    ]
  };
  const OTHER_CATEGORY_QUERY = 'SELECT date_trunc_ym(`incident_occurrence`) AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `incident_occurrence` >= \'2001-01-01T00:00:00.000\' AND `incident_occurrence` < \'2003-06-01T00:00:00.000\' AND ( blood_alcohol_level != \'0.01\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.02\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.03\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.04\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.05\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.06\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.07\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.08\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.09\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.1\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'0.11\' OR blood_alcohol_level IS NULL ) AND ( blood_alcohol_level != \'Apostrophe\'\'s escaped\' OR blood_alcohol_level IS NULL ) GROUP BY date_trunc_ym(`incident_occurrence`) ORDER BY __measure_alias__ DESC LIMIT 1000';
  const OTHER_CATEGORY_QUERY_DATA = {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ['2001-10-01T00:00:00.000', 81],
      ['2001-06-01T00:00:00.000', 76],
      ['2001-07-01T00:00:00.000', 75],
      ['2001-03-01T00:00:00.000', 74],
      ['2001-09-01T00:00:00.000', 72],
      ['2001-05-01T00:00:00.000', 71],
      ['2001-08-01T00:00:00.000', 70],
      ['2001-11-01T00:00:00.000', 69],
      ['2001-04-01T00:00:00.000', 66],
      ['2001-12-01T00:00:00.000', 65],
      ['2001-01-01T00:00:00.000', 61],
      ['2001-02-01T00:00:00.000', 57]
    ]
  };

  let groupingQueryVifs;
  let revertGroupedTimeDataManagerAPI;

  beforeEach(() => {
    I18n.translations.en = allLocales.en;

    groupingQueryVifs = {
      '{"configuration":{},"format":{"type":"visualization_interchange_format","version":2},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"incident_occurrence","aggregationFunction":null,"grouping":{"columnName":"blood_alcohol_level"}},"domain":"example.com","filters":[{"arguments":{"start":"2001-01-01T00:00:00.000","end":"2003-06-01T00:00:00.000"},"columnName":"incident_occurrence","function":"timeRange"},{"function":"in","columnName":"blood_alcohol_level","arguments":["0.01","0.02","0.03","0.04","0.05","0.06","0.07","0.08","0.09","0.1","0.11","Apostrophe\'s escaped"]}],"measure":{"columnName":null,"aggregationFunction":"count"},"precision":"month","type":"socrata.soql"},"type":"timelineChart"}],"requireGroupingInSelect":true,"groupingColumnName":"blood_alcohol_level"}': {
        columns: ['dimension', 'grouping', 'measure'],
        rows: [
          // 0.01
          ['2001-02-01T00:00:00.000', '0.01', 2],
          ['2001-03-01T00:00:00.000', '0.01', null],
          ['2001-04-01T00:00:00.000', '0.01', 1],
          ['2001-05-01T00:00:00.000', '0.01', 1],
          ['2001-06-01T00:00:00.000', '0.01', null],
          ['2001-07-01T00:00:00.000', '0.01', null],
          ['2001-08-01T00:00:00.000', '0.01', null],
          ['2001-09-01T00:00:00.000', '0.01', null],
          ['2001-10-01T00:00:00.000', '0.01', 1],
          ['2001-11-01T00:00:00.000', '0.01', 1],
          ['2001-12-01T00:00:00.000', '0.01', null],
          // 0.02
          ['2001-01-01T00:00:00.000', '0.02', 2],
          ['2001-02-01T00:00:00.000', '0.02', 1],
          ['2001-03-01T00:00:00.000', '0.02', 1],
          ['2001-04-01T00:00:00.000', '0.02', 3],
          ['2001-05-01T00:00:00.000', '0.02', 1],
          ['2001-06-01T00:00:00.000', '0.02', null],
          ['2001-07-01T00:00:00.000', '0.02', null],
          ['2001-08-01T00:00:00.000', '0.02', 4],
          ['2001-09-01T00:00:00.000', '0.02', null],
          ['2001-10-01T00:00:00.000', '0.02', null],
          ['2001-11-01T00:00:00.000', '0.02', 1],
          ['2001-12-01T00:00:00.000', '0.02', 1],
          ['2002-01-01T00:00:00.000', '0.02', null],
          // 0.03
          ['2001-01-01T00:00:00.000', '0.03', 1],
          ['2001-02-01T00:00:00.000', '0.03', 1],
          ['2001-03-01T00:00:00.000', '0.03', 1],
          ['2001-04-01T00:00:00.000', '0.03', 2],
          ['2001-05-01T00:00:00.000', '0.03', 1],
          ['2001-06-01T00:00:00.000', '0.03', 1],
          ['2001-07-01T00:00:00.000', '0.03', 1],
          ['2001-08-01T00:00:00.000', '0.03', 1],
          ['2001-09-01T00:00:00.000', '0.03', 1],
          ['2001-10-01T00:00:00.000', '0.03', 1],
          ['2001-11-01T00:00:00.000', '0.03', null],
          // 0.04
          ['2001-01-01T00:00:00.000', '0.04', 2],
          ['2001-02-01T00:00:00.000', '0.04', 2],
          ['2001-03-01T00:00:00.000', '0.04', 2],
          ['2001-04-01T00:00:00.000', '0.04', 1],
          ['2001-05-01T00:00:00.000', '0.04', null],
          ['2001-06-01T00:00:00.000', '0.04', null],
          ['2001-07-01T00:00:00.000', '0.04', 1],
          ['2001-08-01T00:00:00.000', '0.04', null],
          ['2001-09-01T00:00:00.000', '0.04', 1],
          ['2001-10-01T00:00:00.000', '0.04', null],
          ['2001-11-01T00:00:00.000', '0.04', 1],
          ['2001-12-01T00:00:00.000', '0.04', 1],
          ['2002-01-01T00:00:00.000', '0.04', null],
          // 0.05
          ['2001-02-01T00:00:00.000', '0.05', 3],
          ['2001-03-01T00:00:00.000', '0.05', 1],
          ['2001-04-01T00:00:00.000', '0.05', null],
          ['2001-05-01T00:00:00.000', '0.05', 1],
          ['2001-06-01T00:00:00.000', '0.05', 2],
          ['2001-07-01T00:00:00.000', '0.05', 2],
          ['2001-08-01T00:00:00.000', '0.05', 1],
          ['2001-09-01T00:00:00.000', '0.05', 1],
          ['2001-10-01T00:00:00.000', '0.05', 1],
          ['2001-11-01T00:00:00.000', '0.05', 2],
          ['2001-12-01T00:00:00.000', '0.05', 2],
          ['2002-01-01T00:00:00.000', '0.05', null],
          // 0.06
          ['2001-01-01T00:00:00.000', '0.06', 3],
          ['2001-02-01T00:00:00.000', '0.06', null],
          ['2001-03-01T00:00:00.000', '0.06', 1],
          ['2001-04-01T00:00:00.000', '0.06', null],
          ['2001-05-01T00:00:00.000', '0.06', null],
          ['2001-06-01T00:00:00.000', '0.06', 1],
          ['2001-07-01T00:00:00.000', '0.06', null],
          ['2001-08-01T00:00:00.000', '0.06', 3],
          ['2001-09-01T00:00:00.000', '0.06', 2],
          ['2001-10-01T00:00:00.000', '0.06', 1],
          ['2001-11-01T00:00:00.000', '0.06', 4],
          ['2001-12-01T00:00:00.000', '0.06', null],
          // 0.07
          ['2001-02-01T00:00:00.000', '0.07', 1],
          ['2001-03-01T00:00:00.000', '0.07', 2],
          ['2001-04-01T00:00:00.000', '0.07', 2],
          ['2001-05-01T00:00:00.000', '0.07', 2],
          ['2001-06-01T00:00:00.000', '0.07', 1],
          ['2001-07-01T00:00:00.000', '0.07', 1],
          ['2001-08-01T00:00:00.000', '0.07', 1],
          ['2001-09-01T00:00:00.000', '0.07', 2],
          ['2001-10-01T00:00:00.000', '0.07', 4],
          ['2001-11-01T00:00:00.000', '0.07', 1],
          ['2001-12-01T00:00:00.000', '0.07', 1],
          ['2002-01-01T00:00:00.000', '0.07', null],
          // 0.08
          ['2001-02-01T00:00:00.000', '0.08', 6],
          ['2001-03-01T00:00:00.000', '0.08', 1],
          ['2001-04-01T00:00:00.000', '0.08', null],
          ['2001-05-01T00:00:00.000', '0.08', 1],
          ['2001-06-01T00:00:00.000', '0.08', 3],
          ['2001-07-01T00:00:00.000', '0.08', 2],
          ['2001-08-01T00:00:00.000', '0.08', null],
          ['2001-09-01T00:00:00.000', '0.08', 2],
          ['2001-10-01T00:00:00.000', '0.08', 1],
          ['2001-11-01T00:00:00.000', '0.08', 2],
          ['2001-12-01T00:00:00.000', '0.08', null],
          // 0.09
          ['2001-01-01T00:00:00.000', '0.09', 2],
          ['2001-02-01T00:00:00.000', '0.09', 1],
          ['2001-03-01T00:00:00.000', '0.09', 1],
          ['2001-04-01T00:00:00.000', '0.09', 2],
          ['2001-05-01T00:00:00.000', '0.09', null],
          ['2001-06-01T00:00:00.000', '0.09', 2],
          ['2001-07-01T00:00:00.000', '0.09', 3],
          ['2001-08-01T00:00:00.000', '0.09', 4],
          ['2001-09-01T00:00:00.000', '0.09', 1],
          ['2001-10-01T00:00:00.000', '0.09', 1],
          ['2001-11-01T00:00:00.000', '0.09', null],
          ['2001-12-01T00:00:00.000', '0.09', 1],
          ['2002-01-01T00:00:00.000', '0.09', null],
          // 0.1
          ['2001-01-01T00:00:00.000', '0.1', 1],
          ['2001-02-01T00:00:00.000', '0.1', 2],
          ['2001-03-01T00:00:00.000', '0.1', null],
          ['2001-04-01T00:00:00.000', '0.1', 1],
          ['2001-05-01T00:00:00.000', '0.1', 1],
          ['2001-06-01T00:00:00.000', '0.1', 1],
          ['2001-07-01T00:00:00.000', '0.1', 1],
          ['2001-08-01T00:00:00.000', '0.1', 2],
          ['2001-09-01T00:00:00.000', '0.1', 1],
          ['2001-10-01T00:00:00.000', '0.1', null],
          ['2001-11-01T00:00:00.000', '0.1', 1],
          ['2001-12-01T00:00:00.000', '0.1', 2],
          ['2002-01-01T00:00:00.000', '0.1', null],
          // 0.11
          ['2001-01-01T00:00:00.000', '0.11', 1],
          ['2001-02-01T00:00:00.000', '0.11', 2],
          ['2001-03-01T00:00:00.000', '0.11', 3],
          ['2001-04-01T00:00:00.000', '0.11', 1],
          ['2001-05-01T00:00:00.000', '0.11', 1],
          ['2001-06-01T00:00:00.000', '0.11', 2],
          ['2001-07-01T00:00:00.000', '0.11', 1],
          ['2001-08-01T00:00:00.000', '0.11', null],
          ['2001-09-01T00:00:00.000', '0.11', 2],
          ['2001-10-01T00:00:00.000', '0.11', 1],
          ['2001-11-01T00:00:00.000', '0.11', 1],
          ['2001-12-01T00:00:00.000', '0.11', 1],
          ['2002-01-01T00:00:00.000', '0.11', null],
          // Apostrophe's escaped
          ['2001-02-01T00:00:00.000', 'Apostrophe\'s escaped', 1],
          ['2001-03-01T00:00:00.000', 'Apostrophe\'s escaped', 1],
          ['2001-04-01T00:00:00.000', 'Apostrophe\'s escaped', null],
          ['2001-05-01T00:00:00.000', 'Apostrophe\'s escaped', null],
          ['2001-06-01T00:00:00.000', 'Apostrophe\'s escaped', 2],
          ['2001-07-01T00:00:00.000', 'Apostrophe\'s escaped', null],
          ['2001-08-01T00:00:00.000', 'Apostrophe\'s escaped', null],
          ['2001-09-01T00:00:00.000', 'Apostrophe\'s escaped', 1],
          ['2001-10-01T00:00:00.000', 'Apostrophe\'s escaped', null],
          ['2001-11-01T00:00:00.000', 'Apostrophe\'s escaped', 2],
          ['2001-12-01T00:00:00.000', 'Apostrophe\'s escaped', null]
        ]
      }
    };

    GroupedTimeDataManagerAPI.__Rewire__('SoqlDataProvider', function() {
      this.query = function(queryString) {
        // SoqlDataProvider.query() performs a string transformation to
        // reduce unnecessary whitespace before it URI encodes the query
        // string; in order to match the one-line, reformatted queries here
        // we must here do the same string transformation (but not the URI
        // encoding).
        const trimmedAndReformattedQueryString = queryString.
          replace(/[\n\s]+/g, ' ').
          trim();

        switch (trimmedAndReformattedQueryString) {

          case GROUPING_VALUES_QUERY:
            return Promise.resolve(GROUPING_VALUES_QUERY_DATA);

          case OTHER_CATEGORY_QUERY:
            return Promise.resolve(OTHER_CATEGORY_QUERY_DATA);

          default:
            return Promise.reject(
              `Unrecognized query: "${trimmedAndReformattedQueryString}".`
            );
        }
      };
    });

    GroupedTimeDataManagerAPI.__Rewire__('makeSocrataTimeDataRequest', function(vif, seriesIndex, maxRowCount) {
      const vifForQuery = _.cloneDeep(vif);
      _.unset(vifForQuery, 'series[0].dataSource.precision');

      let stringifiedGroupingQueryVif;
      let queryResponse = false;

      for (stringifiedGroupingQueryVif in groupingQueryVifs) {
        const groupingQueryVif = JSON.parse(stringifiedGroupingQueryVif);
        _.unset(groupingQueryVif, 'series[0].dataSource.precision');

        if (_.isEqual(vifForQuery, groupingQueryVif)) {
          queryResponse = groupingQueryVifs[stringifiedGroupingQueryVif];
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
    });
  });

  afterEach(() => {
    I18n.translations = {};

    GroupedTimeDataManagerAPI.__ResetDependency__('SoqlDataProvider');
    GroupedTimeDataManagerAPI.__ResetDependency__('makeSocrataTimeDataRequest');
  });

  it('returns the expected grouped data.', () => {
    const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);

    return GroupedTimeDataManager.getData(
      vif,
      {
        MAX_ROW_COUNT: MAX_ROW_COUNT,
        getPrecisionBySeriesIndex: () => { return Promise.resolve('month'); },
        mapPrecisionToDateTruncFunction: () => { return 'date_trunc_ym'; }
      }
    ).
      then((actualData) => {
        const expectedData = {
          'columns': ['dimension', '0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.07', '0.08', '0.09', '0.1', '0.11', "Apostrophe's escaped", '(Other)'],
          'rows': [
            ['2001-01-01T00:00:00.000', null, 2, 1, 2, null, 3, null, null, 2, 1, 1, null, 61],
            ['2001-02-01T00:00:00.000', 2, 1, 1, 2, 3, null, 1, 6, 1, 2, 2, 1, 57],
            ['2001-03-01T00:00:00.000', null, 1, 1, 2, 1, 1, 2, 1, 1, null, 3, 1, 74],
            ['2001-04-01T00:00:00.000', 1, 3, 2, 1, null, null, 2, null, 2, 1, 1, null, 66],
            ['2001-05-01T00:00:00.000', 1, 1, 1, null, 1, null, 2, 1, null, 1, 1, null, 71],
            ['2001-06-01T00:00:00.000', null, null, 1, null, 2, 1, 1, 3, 2, 1, 2, 2, 76],
            ['2001-07-01T00:00:00.000', null, null, 1, 1, 2, null, 1, 2, 3, 1, 1, null, 75],
            ['2001-08-01T00:00:00.000', null, 4, 1, null, 1, 3, 1, null, 4, 2, null, null, 70],
            ['2001-09-01T00:00:00.000', null, null, 1, 1, 1, 2, 2, 2, 1, 1, 2, 1, 72],
            ['2001-10-01T00:00:00.000', 1, null, 1, null, 1, 1, 4, 1, 1, null, 1, null, 81],
            ['2001-11-01T00:00:00.000', 1, 1, null, 1, 2, 4, 1, 2, null, 1, 1, 2, 69],
            ['2001-12-01T00:00:00.000', null, 1, null, 1, 2, null, 1, null, 1, 2, 1, null, 65],
            ['2002-01-01T00:00:00.000', null, null, null, null, null, null, null, null, null, null, null, null, null]
          ],
          'precision':'month'
        };

        // Assert that the data that actually came back is what was expected
        assert.deepEqual(expectedData, actualData);
      }).
      catch((error) => {

        console.error(error);
        throw error;
      });
  });
});
