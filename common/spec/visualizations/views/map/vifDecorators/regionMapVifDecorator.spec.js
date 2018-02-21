import _ from 'lodash';

import * as regionMapVifDecorator from 'common/visualizations/views/map/vifDecorators/regionMapVifDecorator';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import { VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';

describe('regionMapVifDecorator', () => {
  let vif;

  beforeEach(() => {
    vif = mapMockVif({});
  });

  describe('number Of DataClasses', () => {
    describe('number of DataClasses not configured', () => {
      it('should return default NumberOfDataClasses', () => {
        const decoratedVif = _.merge({}, regionMapVifDecorator, vif);

        assert.equal(decoratedVif.getNumberOfDataClasses(), VIF_CONSTANTS.NUMBER_OF_DATA_CLASSES.DEFAULT);
      });
    });

    describe('number of DataClasses configured', () => {
      it('should return configured NumberOfDataClasses', () => {
        vif.series[0].mapOptions.numberOfDataClasses = 4;
        const decoratedVif = _.merge({}, regionMapVifDecorator, vif);

        assert.equal(decoratedVif.getNumberOfDataClasses(), 4);
      });
    });
  });

  describe('RegionMap Buckets', () => {
    it('should return region Map buckets for given vif', () => {
      vif.series[0].mapOptions.numberOfDataClasses = 4;

      const decoratedVif = _.merge({}, regionMapVifDecorator, vif);

      const measures = [
        { shapeId: 'supervisor_dists1', value: 55 },
        { shapeId: 'supervisor_dists2', value: 15407 },
        { shapeId: 'supervisor_dists3', value: 27554 },
        { shapeId: 'supervisor_dists4', value: 34232 },
        { shapeId: 'supervisor_dists5', value: 22141 },
        { shapeId: 'supervisor_dists6', value: 12988 },
        { shapeId: 'supervisor_dists7', value: 16824 },
        { shapeId: 'supervisor_dists8', value: 29702 }
      ];

      const expectedResult = [
        { start: 55, end: 16824, color: '#e41a1c' },
        { start: 16824, end: 22141, color: '#9e425a' },
        { start: 22141, end: 34232, color: '#596a98' }
      ];

      const mapBuckets = decoratedVif.getRegionMapBuckets(measures);

      assert.deepEqual(expectedResult, mapBuckets);
    });
  });
});
