
import _ from 'lodash';

import makeSocrataTimeDataRequest, {
  __RewireAPI__ as makeSocrataTimeDataRequestAPI
} from 'common/visualizations/dataProviders/makeSocrataTimeDataRequest';

const vifBase = {
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
          columnName: 'station',
          aggregationFunction: null,
          grouping: {
            columnName: 'sensor_type'
          }
        },
        domain: 'example.com',
        filters: [],
        orderBy: {
          parameter: 'measure',
          sort: 'desc'
        },
        limit: 20,
        measure: {
          columnName: null,
          aggregationFunction: 'count'
        },
        type: 'socrata.soql'
      },
      type: 'timelineChart'
    }
  ]
};

function SoqlDataProviderStub() {
  this.query = (queryString) => {
    const trimmedAndReformattedQueryString = queryString.replace(/[\n\s]+/g, ' ').trim();
    return Promise.resolve(trimmedAndReformattedQueryString);
  };
}

function dWQRStub(...args) {
  return (query) => query;
}

describe('makeSocrataTimeDataRequest', () => {

  beforeEach(() => {
    makeSocrataTimeDataRequestAPI.__Rewire__('SoqlDataProvider', SoqlDataProviderStub);
    makeSocrataTimeDataRequestAPI.__Rewire__('dealWithQueryResponse', dWQRStub);
  });

  afterEach(() => {
    makeSocrataTimeDataRequestAPI.__ResetDependency__('dealWithQueryResponse');
    makeSocrataTimeDataRequestAPI.__ResetDependency__('SoqlDataProvider');
  });

  it('verify query when precision is year', (done) => {

    const options = {
      dateTruncFunction: 'date_trunc_y',
      precision: 'year',
      maxRowCount: 1000
    };

    const vif = _.cloneDeep(vifBase);

    makeSocrataTimeDataRequest(vif, 0, options).then((query) => {

      assert.equal(
        query,
        'SELECT date_trunc_y(`station`) AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `station` IS NOT NULL AND `station` < \'9999-01-01\' AND (1=1) GROUP BY date_trunc_y(`station`) LIMIT 1001'
      );

    }).then(done, done);
  });

  it('verify query when precision is month', (done) => {

    const options = {
      dateTruncFunction: 'date_trunc_ym',
      precision: 'month',
      maxRowCount: 1000
    };

    const vif = _.cloneDeep(vifBase);

    makeSocrataTimeDataRequest(vif, 0, options).then((query) => {

      assert.equal(
        query,
        'SELECT date_trunc_ym(`station`) AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `station` IS NOT NULL AND `station` < \'9999-01-01\' AND (1=1) GROUP BY date_trunc_ym(`station`) LIMIT 1001'
      );

    }).then(done, done);
  });

  it('verify query when precision is day', (done) => {

    const options = {
      dateTruncFunction: 'date_trunc_ymd',
      precision: 'day',
      maxRowCount: 1000
    };

    const vif = _.cloneDeep(vifBase);

    makeSocrataTimeDataRequest(vif, 0, options).then((query) => {

      assert.equal(
        query,
        'SELECT date_trunc_ymd(`station`) AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `station` IS NOT NULL AND `station` < \'9999-01-01\' AND (1=1) GROUP BY date_trunc_ymd(`station`) LIMIT 1001'
      );

    }).then(done, done);
  });
});
