import _ from 'lodash';

import makeSocrataCategoricalDataRequest, {
  __RewireAPI__ as makeSocrataCategoricalDataRequestAPI
} from 'common/visualizations/dataProviders/makeSocrataCategoricalDataRequest';

import GroupedCategoricalDataManager, {
  __RewireAPI__ as GroupedCategoricalDataManagerAPI
} from 'common/visualizations/dataProviders/GroupedCategoricalDataManager';

import SOQL_QUERY_RESPONSES from './testData/GroupedCategoricalDataManagerTestData';

import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';

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
const MAX_GROUP_COUNT = 2;

const SoqlDataProviderStub = function() {

  this.query = function(queryString) {
    // SoqlDataProvider.query() performs a string transformation to reduce
    // unnecessary whitespace before it URI encodes the query string; in order
    // to match the one-line, reformatted queries in SOQL_QUERY_RESPONSES we
    // must here do the same string transformation (but not the URI encoding).
    const trimmedAndReformattedQueryString = queryString.
      replace(/[\n\s]+/g, ' ').
      trim();

    if (
      SOQL_QUERY_RESPONSES.hasOwnProperty(trimmedAndReformattedQueryString)
    ) {

      return Promise.resolve(
        SOQL_QUERY_RESPONSES[trimmedAndReformattedQueryString]
      );
    } else {

      return Promise.reject(
        `Unrecognized query: "${trimmedAndReformattedQueryString}".`
      );
    }
  };
};
const logAndThrow = (error) => {
  console.error(error);
  throw new Error(error);
};

describe('GroupedCategoricalDataManager', () => {
  beforeEach(() => {
    I18n.translations.en = allLocales.en;

    makeSocrataCategoricalDataRequestAPI.__Rewire__('SoqlDataProvider', SoqlDataProviderStub);
    GroupedCategoricalDataManagerAPI.__Rewire__('SoqlDataProvider', SoqlDataProviderStub);
    GroupedCategoricalDataManagerAPI.__Rewire__('makeSocrataCategoricalDataRequest', makeSocrataCategoricalDataRequest);
  });

  afterEach(() => {
    I18n.translations = {};

    makeSocrataCategoricalDataRequestAPI.__ResetDependency__('SoqlDataProvider');
    GroupedCategoricalDataManagerAPI.__ResetDependency__('SoqlDataProvider');
    GroupedCategoricalDataManagerAPI.__ResetDependency__('makeSocrataCategoricalDataRequest');
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
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

        return GroupedCategoricalDataManager.getData(
          vif,
          {MAX_ROW_COUNT, MAX_GROUP_COUNT}
        ).
          then((response) => {
            assert.deepEqual(response, expectedTable);
          }).
          catch(logAndThrow);
      });
    });
  });

  describe('when aggregating by sum', () => {

    it('aggregates by sum, not count', () => {
      const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
      vif.series[0].dataSource.measure = {
        columnName: 'plausibility',
        aggregationFunction: 'sum'
      };
      vif.configuration.showOtherCategory = false;
      const expectedTable = {
        columns: ['dimension', '10', '9', '(Other)'],
        rows: [
          ['0.05', 7, 11, 200],
          ['0.01', 3, 9, 100]
        ]
      };
      return GroupedCategoricalDataManager.getData(vif, {MAX_ROW_COUNT, MAX_GROUP_COUNT}).
        then((response) => {
          assert.deepEqual(response, expectedTable);
        }).
        catch(logAndThrow);
    });

  });
});
