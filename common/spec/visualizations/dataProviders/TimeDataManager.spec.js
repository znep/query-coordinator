import _ from 'lodash';
import TimeDataManager, {
  __RewireAPI__ as TimeDataManagerAPI
} from 'visualizations/dataProviders/TimeDataManager';

const VALID_VIF = {
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
          aggregationFunction: null
        },
        domain: 'example.com',
        filters: [],
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

describe('TimeDataManager', () => {
  beforeEach(() => {
    TimeDataManagerAPI.__Rewire__('SoqlDataProvider', function() {
      this.getRows = () => Promise.resolve({
        columns: ['__dimension_alias__', '__measure_alias__'],
        rows: [['2001-01-01T00:00:00.000', '2001-12-31T00:00:00.000']]
      });
    });
  });

  afterEach(() => {
    TimeDataManagerAPI.__ResetDependency__('SoqlDataProvider');
  });

  describe('getPrecisionBySeriesIndex()', () => {

    it('does not compute a precision when the precision property in the vif is recognized', () => {
      const vif = _.cloneDeep(VALID_VIF);
      _.set(vif, 'series[0].dataSource.precision', 'year');

      return TimeDataManager.getPrecisionBySeriesIndex(vif, 0).
        then((precision) => {

          assert.equal(precision, 'year');
        });
    });

    // EN-13478 - This function previously attempted to call `.toLowerCase()` on
    // the precision from the vif, but `null` is a valid value for precision,
    // which resulted in a TypeError from it trying to call that method on
    // `null`, which does not implement it.
    it('computes a precision when the precision property in the vif is `null`', () => {
      const vif = _.cloneDeep(VALID_VIF);
      _.set(vif, 'series[0].dataSource.precision', null);

      return TimeDataManager.getPrecisionBySeriesIndex(vif, 0).
        then((precision) => {

          assert.equal(precision, 'day');
        });
    });

    it('computes a precision when no precision is specified in the vif', () => {
      const vif = _.cloneDeep(VALID_VIF);

      return TimeDataManager.getPrecisionBySeriesIndex(vif, 0).
        then((precision) => {

          assert.equal(precision, 'day');
        });
    });
  });
});
