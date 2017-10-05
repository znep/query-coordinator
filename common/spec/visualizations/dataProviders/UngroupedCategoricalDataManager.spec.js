import _ from 'lodash';

import UngroupedCategoricalDataManager, {
  __RewireAPI__ as UngroupedCategoricalDataManagerAPI
} from 'common/visualizations/dataProviders/UngroupedCategoricalDataManager';


const vifBase = {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  series: [
    {
      dataSource: {
        datasetUid: 'four-four',
        dimension: {
          columnName: 'month',
          aggregationFunction: null,
          grouping: {
            columnName: 'station'
          }
        },
        domain: 'example.com',
        filters: [],
        orderBy: {
          parameter: 'dimension',
          sort: 'asc'
        },
        limit: 20,
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


const inputVifs = {
  basicEnglish: Object.assign({}, _.cloneDeep(vifBase), {id: 'basicEnglish'}),
  abbrvEnglish: Object.assign({}, _.cloneDeep(vifBase), {id: 'abbrvEnglish'}),
  basicRussian: Object.assign({}, _.cloneDeep(vifBase), {id: 'basicRussian'}),
  abbrvRussian: Object.assign({}, _.cloneDeep(vifBase), {id: 'abbrvRussian'})
};


const outputResults = {
  basicEnglish: {
    columns: ['dimension', null],
    rows: [
      ['April', 3],
      ['February', 12],
      ['January', 21],
      ['March', 30]
    ]
  },
  abbrvEnglish: {
    columns: ['dimension', null],
    rows: [
      ['apr', 3],
      ['feb', 12],
      ['jan', 21],
      ['mar', 30]
    ]
  },
  basicRussian: {
    columns: ['dimension', null],
    rows: [
      ['апрель', 3],
      ['февраль', 12],
      ['январь', 21],
      ['март', 30]
    ]
  },
  abbrvRussian: {
    columns: ['dimension', null],
    rows: [
      ['апр', 3],
      ['фев', 12],
      ['янв', 21],
      ['мар', 30]
    ]
  }
};


const logAndThrow = (error) => {
  console.error(error);
  console.error(error.stack);
  throw new Error(error);
};


function mSCDRStub(vif, seriesIndex, maxRowCount) {
  return Promise.resolve(outputResults[vif.id]);
}


describe('UngroupedCategoricalDataManager', () => {

  beforeEach(() => {
    UngroupedCategoricalDataManagerAPI.__Rewire__('makeSocrataCategoricalDataRequest', mSCDRStub);
  });

  afterEach(() => {
    UngroupedCategoricalDataManagerAPI.__ResetDependency__('makeSocrataCategoricalDataRequest');
  });

  describe('forced month column sorting behavior', () => {

    it('sorts full English month columns by month order', () => {
      const expectedTable = {
        columns: ['dimension', ''],
        rows: [
          ['January', 21],
          ['February', 12],
          ['March', 30],
          ['April', 3]
        ]
      };
      return UngroupedCategoricalDataManager.getData(
        inputVifs.basicEnglish, {MAX_ROW_COUNT: 1000, MAX_GROUP_COUNT: 100}).
        then((response) => {
          assert.deepEqual(response, expectedTable);
        }).
        catch(logAndThrow);
    });

    it('sorts abbreviated English month columns by month order', () => {
      const expectedTable = {
        columns: ['dimension', ''],
        rows: [
          ['jan', 21],
          ['feb', 12],
          ['mar', 30],
          ['apr', 3]
        ]
      };
      return UngroupedCategoricalDataManager.getData(
        inputVifs.abbrvEnglish, {MAX_ROW_COUNT: 1000, MAX_GROUP_COUNT: 100}).
        then((response) => {
          assert.deepEqual(response, expectedTable);
        }).
        catch(logAndThrow);
    });

    it('sorts full Russian month columns by month order', () => {
      const expectedTable = {
        columns: ['dimension', ''],
        rows: [
          ['январь', 21],
          ['февраль', 12],
          ['март', 30],
          ['апрель', 3]
        ]
      };
      return UngroupedCategoricalDataManager.getData(
        inputVifs.basicRussian, {MAX_ROW_COUNT: 1000, MAX_GROUP_COUNT: 100}).
        then((response) => {
          assert.deepEqual(response, expectedTable);
        }).
        catch(logAndThrow);
    });

    it('sorts abbreviated Russian month columns by month order', () => {
      const expectedTable = {
        columns: ['dimension', ''],
        rows: [
          ['янв', 21],
          ['фев', 12],
          ['мар', 30],
          ['апр', 3]
        ]
      };
      return UngroupedCategoricalDataManager.getData(
        inputVifs.abbrvRussian, {MAX_ROW_COUNT: 1000, MAX_GROUP_COUNT: 100}).
        then((response) => {
          assert.deepEqual(response, expectedTable);
        }).
        catch(logAndThrow);
    });

  });

});
