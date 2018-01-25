import _ from 'lodash';

import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import * as pointMapVifDecorator from 'common/visualizations/views/map/vifDecorators/pointMapVifDecorator';

describe('pointMapVifDecorator', () => {
  describe('point circle radius', () => {
    const vif = mapMockVif({});
    beforeEach(() => {
      vif.series[0].mapOptions.minimumPointSize = 10;
      vif.series[0].mapOptions.maximumPointSize = 170;
      vif.series[0].mapOptions.numberOfDataClasses = 4;
    });

    describe('resizePointsBy not configured in mapOptions', () => {
      it('should return Default radius', () => {
        vif.series[0].mapOptions.resizePointsBy = undefined;

        const decoratedVif = _.merge({}, pointMapVifDecorator, vif);

        assert.equal(decoratedVif.getPointCircleRadius(), 5);
      });
    });

    describe('resizePointsBy configured', () => {
      it('should return resizeRangeBy buckets', () => {
        vif.series[0].mapOptions.resizePointsBy = '__resize_by__';
        const decoratedVif = _.merge({}, pointMapVifDecorator, vif);
        const resizeRangeBy = { min: 7, avg: 1, max: 85 };
        const expectedResult = {
          type: 'exponential',
          property: '__count__',
          default: 5,
          stops: [[7, 5], [27, 25], [47, 45], [67, 65], [87, 85]]
        };

        const rangeBuckets = decoratedVif.getPointCircleRadius(resizeRangeBy, '__count__');

        assert.deepEqual(rangeBuckets, expectedResult);
      });
    });
  });
});
