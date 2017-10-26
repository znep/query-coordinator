import _ from 'lodash';

import makeSocrataCategoricalDataRequest, {
  __RewireAPI__ as makeSocrataCategoricalDataRequestAPI
} from 'common/visualizations/dataProviders/makeSocrataCategoricalDataRequest';

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
      type: 'barChart'
    }
  ]
};

function SoqlDataProviderStub() {
  this.query = function(queryString) {
    const trimmedAndReformattedQueryString = queryString.replace(/[\n\s]+/g, ' ').trim();
    return Promise.resolve(trimmedAndReformattedQueryString);
  };
}

function dWQRStub(...args) {
  return (query) => query;
}

function mQRTDTStub(query) {
  return query;
}

describe('makeSocrataCategoricalDataRequest', () => {

  beforeEach(() => {
    makeSocrataCategoricalDataRequestAPI.__Rewire__('SoqlDataProvider', SoqlDataProviderStub);
    makeSocrataCategoricalDataRequestAPI.__Rewire__('mapQueryResponseToDataTable', mQRTDTStub);
    makeSocrataCategoricalDataRequestAPI.__Rewire__('dealWithQueryResponse', dWQRStub);
  });

  afterEach(() => {
    makeSocrataCategoricalDataRequestAPI.__ResetDependency__('dealWithQueryResponse');
    makeSocrataCategoricalDataRequestAPI.__ResetDependency__('mapQueryResponseToDataTable');
    makeSocrataCategoricalDataRequestAPI.__ResetDependency__('SoqlDataProvider');
  });

  it('counts dimensions', (done) => {
    const vif = _.cloneDeep(vifBase);
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        'SELECT `station` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `station` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21'
      );
      done();
    });
  });

  it('counts sums', (done) => {
    const vif = _.cloneDeep(vifBase);
    _.set(vif, 'series[0].dataSource.measure.columnName', 'contacts');
    _.set(vif, 'series[0].dataSource.measure.aggregationFunction', 'sum');
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        'SELECT `station` AS __dimension_alias__, SUM(`contacts`) AS __measure_alias__ GROUP BY `station` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21'
      );
      done();
    });
  });

  it('requires grouping in select', (done) => {
    const vif = _.cloneDeep(vifBase);
    _.set(vif, 'requireGroupingInSelect', true);
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        'SELECT `station` AS __dimension_alias__, `sensor_type` AS __grouping_alias__, COUNT(*) AS __measure_alias__ GROUP BY `station`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21'
      );
      done();
    });
  });

  it('makes an unaggregated query', (done) => {
    const vif = _.cloneDeep(vifBase);
    _.set(vif, 'series[0].dataSource.dimension.aggregationFunction', null);
    _.set(vif, 'series[0].dataSource.measure.aggregationFunction', null);
    // TODO: This does not make sense: the isUnaggregatedQuery logic relies on
    // measure.aggregationFunction to be set to null, but that generates the
    // SELECT `null` nonsense below. Still, adding a test for the weird behavior.
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        'SELECT `station` AS __dimension_alias__, `null` AS __measure_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21'
      );
      done();
    });
  });

  it('exercises basic filtering', (done) => {
    const vif = _.cloneDeep(vifBase);
    _.set(vif, 'series[0].dataSource.filters', [
      {
        function: 'binaryOperator',
        columnName: 'station',
        arguments: { operator: '=', operand: 'alpha' }
      }
    ]);
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        "SELECT `station` AS __dimension_alias__, COUNT(*) AS __measure_alias__ WHERE `station` = 'alpha' GROUP BY `station` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21"
      );
      done();
    });
  });

  it('exercises real in clause filtering', (done) => {
    const vif = _.cloneDeep(vifBase);
    _.set(vif, 'requireGroupingInSelect', true);
    _.set(vif, 'series[0].dataSource.filters', [
      {
        function: 'in',
        columnName: 'station',
        arguments: ['alpha', 'bravo', 'charlie', 'delta']
      },
      {
        function: 'in',
        columnName: 'sensor_type',
        arguments: ['0459', '35215', '972413', '8538930']
      }
    ]);
    makeSocrataCategoricalDataRequest(vif, 0, 1001).then((query) => {
      assert.equal(
        query,
        "SELECT `station` AS __dimension_alias__, `sensor_type` AS __grouping_alias__, COUNT(*) AS __measure_alias__ WHERE `station` IN ('alpha', 'bravo', 'charlie', 'delta') AND `sensor_type` IN ('0459', '35215', '972413', '8538930') GROUP BY `station`, __grouping_alias__ ORDER BY __measure_alias__ DESC NULL LAST LIMIT 21"
      );
      done();
    });
  });

});
