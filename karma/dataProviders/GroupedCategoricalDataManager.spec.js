const _ = require('lodash');
const rewire = require('rewire');
const makeSocrataCategoricalDataRequestAPI = rewire('../../src/dataProviders/makeSocrataCategoricalDataRequest');
const GroupedCategoricalDataManagerAPI = rewire('../../src/dataProviders/GroupedCategoricalDataManager');
const SOQL_QUERY_RESPONSES = require('./testData/GroupedCategoricalDataManagerTestData');

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
        orderBy: {
          parameter: 'measure',
          sort: 'desc'
        },
        limit: 2,
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

const SoqlDataProviderStub = function() {

  this.query = function(queryString) {
    const trimmedAndDecodedQueryString = decodeURIComponent(queryString.trim());

    if (SOQL_QUERY_RESPONSES.hasOwnProperty(trimmedAndDecodedQueryString)) {
      return Promise.resolve(SOQL_QUERY_RESPONSES[trimmedAndDecodedQueryString]);
    } else {
      return Promise.reject(`Unrecognized query: "${trimmedAndDecodedQueryString}".`);
    }
  };
};
const logAndThrow = (error) => {
  console.error(error);
  throw new Error(error);
};

describe('GroupedCategoricalDataManager', () => {
  let revertGroupedCategoricalDataManagerAPI;
  let revertMakeSocrataCategoricalDataRequestAPI;

  beforeEach(() => {

    revertMakeSocrataCategoricalDataRequestAPI = makeSocrataCategoricalDataRequestAPI.__set__(
      {
        SoqlDataProvider: SoqlDataProviderStub
      }
    );
    revertGroupedCategoricalDataManagerAPI = GroupedCategoricalDataManagerAPI.__set__(
      {
        MAX_GROUP_COUNT: 2,
        SoqlDataProvider: SoqlDataProviderStub,
        makeSocrataCategoricalDataRequest: makeSocrataCategoricalDataRequestAPI
      }
    );
  });

  afterEach(() => {
    revertMakeSocrataCategoricalDataRequestAPI();
    revertGroupedCategoricalDataManagerAPI();
  });

  describe('When not showing the "other" category', () => {

    describe('when sorting by dimension, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'asc'
        };

        const expectedTable = {
          columns: ['dimension', '1', '2', '(Other)'],
          rows: [
            ['0.01', null, null, 6],
            ['0.02', null, null, 14]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by dimension, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'desc'
        };

        const expectedTable = {
          columns: ['dimension', '10', '9', '(Other)'],
          rows: [
            ['0.5', 1, null, 12],
            ['0.49', null, 2, 9]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by measure, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'asc'
        };

        const expectedTable = {
          columns: ['dimension', '1', '2', '(Other)'],
          rows: [
            ['0.01', null, null, 6],
            ['0.12', null, 1, 6]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by measure, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'desc'
        };

        const expectedTable = {
          columns: ['dimension', '10', '9', '(Other)'],
          rows: [
            [null, 25, 31, 213],
            ['0.48', null, 3, 19],
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });
  });

  describe('when showing the "other" category', () => {

    describe('when sorting by dimension, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'asc'
        };
        vif.configuration.showOtherCategory = true;

        const expectedTable = {
          columns: ['dimension', '1', '2', '(Other)'],
          rows: [
            ['0.01', null, null, 6],
            ['0.02', null, null, 14],
            ['(Other)', 83, 77, 820]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by dimension, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'desc'
        };
        vif.configuration.showOtherCategory = true;

        const expectedTable = {
          columns: ['dimension', '10', '9', '(Other)'],
          rows: [
            ['0.5', 1, null, 12],
            ['0.49', null, 2, 9],
            ['(Other)', 91, 98, 787]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by measure, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'asc'
        };
        vif.configuration.showOtherCategory = true;

        const expectedTable = {
          columns: ['dimension', '1', '2', '(Other)'],
          rows: [
            ['0.01', null, null, 6],
            ['0.12', null, 1, 6],
            ['(Other)', 83, 76, 828]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });

    describe('when sorting by measure, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'desc'
        };
        vif.configuration.showOtherCategory = true;

        const expectedTable = {
          columns: ['dimension', '10', '9', '(Other)'],
          rows: [
            ['(Other)', 67, 66, 576],
            [null, 25, 31, 213],
            ['0.48', null, 3, 19]
          ]
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });
  });
});
