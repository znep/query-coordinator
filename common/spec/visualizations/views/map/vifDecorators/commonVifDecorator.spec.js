import _ from 'lodash';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import * as commonVifDecorator from 'common/visualizations/views/map/vifDecorators/commonVifDecorator';

describe('commonVifDecorator', () => {
  const vif = mapMockVif({});
  describe('ResizeBy range buckets', () => {
    describe('Min/Max values are same from the mapOptions', () => {
      it('should return min value', () => {
        const mapOptionsMinValue = 3;
        const mapOptionsMaxValue = 3;
        const dataClasses = 5;
        const decoratedVif = _.merge({}, commonVifDecorator, vif);
        const resizeRangeBy = { min: 0, avg: 1, max: 1 };

        const resizeRange = decoratedVif.getResizeByRangeBuckets('__count__', resizeRangeBy,
          mapOptionsMinValue, mapOptionsMaxValue, dataClasses, 'interval');

        assert.equal(resizeRange, 3);
      });
    });

    describe('resizeBy min/max values from the dataset are same', () => {
      it('should return average of mapOptions min/max as resizeRange', () => {
        const mapOptionsMinValue = 5;
        const mapOptionsMaxValue = 11;
        const dataClasses = 5;
        const decoratedVif = _.merge({}, commonVifDecorator, vif);
        const resizeRangeBy = { min: 25, avg: 1, max: 25 };

        const resizeRange = decoratedVif.getResizeByRangeBuckets('__count__', resizeRangeBy,
          mapOptionsMinValue, mapOptionsMaxValue, dataClasses, 'interval');

        assert.equal(resizeRange, 8);
      });
    });

    describe('resizeBy min/max and mapOptions min/max are not same', () => {
      it('should return resizeByRange buckets stops', () => {
        const mapOptionsMinValue = 10;
        const mapOptionsMaxValue = 18;
        const dataClasses = 4;
        const expectedResult = {
          type: 'exponential',
          property: '__count__',
          default: 10,
          stops: [[20, 10], [60, 12], [100, 14], [140, 16], [180, 18]]
        };
        const resizeRangeBy = { min: 20, avg: 1, max: 180 };
        const decoratedVif = _.merge({}, commonVifDecorator, vif);

        const rangeBuckets = decoratedVif.getResizeByRangeBuckets('__count__', resizeRangeBy,
          mapOptionsMinValue, mapOptionsMaxValue, dataClasses, 'exponential');

        assert.deepEqual(rangeBuckets, expectedResult);
      });
    });
  });
});
