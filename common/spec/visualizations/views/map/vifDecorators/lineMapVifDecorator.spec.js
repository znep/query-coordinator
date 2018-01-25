import _ from 'lodash';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import * as lineMapVifDecorator from 'common/visualizations/views/map/vifDecorators/lineMapVifDecorator';

describe('lineMapVifDecorator', () => {
  describe('LineWidth', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
    });

    describe('lineWeight is not configured in map options', () => {
      it('should return default LineWidth', () => {
        let defaultLineWidth = 5;
        let decoratedVif = _.merge({}, lineMapVifDecorator, vif);

        let lineWidth = decoratedVif.getLineWidth();
        assert.equal(lineWidth, defaultLineWidth);
      });
    });

    describe('weighLinesBy configured', () => {
      describe('Min/Max width values are same', () => {
        it('should return min width', () => {
          vif.series[0].mapOptions.minimumLineWeight = 3;
          vif.series[0].mapOptions.maximumLineWeight = 3;
          vif.series[0].mapOptions.weighLinesBy = '__weigh_by__';

          let decoratedVif = _.merge({}, lineMapVifDecorator, vif);
          let resizeRangeBy = { min: 0, avg: 1, max: 1 };
          let lineWidth = decoratedVif.getLineWidth('__count__', resizeRangeBy);
          assert.equal(lineWidth, 3);
        });
      });

      describe('resizeBy min/max values from the dataset are same', () => {
        it('should return average line width when min/max in weighByRange', () => {
          vif.series[0].mapOptions.minimumLineWeight = 5;
          vif.series[0].mapOptions.maximumLineWeight = 11;
          vif.series[0].mapOptions.weighLinesBy = '__weigh_by__';

          let decoratedVif = _.merge({}, lineMapVifDecorator, vif);
          let resizeRangeBy = { min: 25, avg: 1, max: 25 };
          let lineWidth = decoratedVif.getLineWidth('__count__', resizeRangeBy);
          assert.equal(lineWidth, 8);
        });
      });

      describe('resizeBy min/max and width min/max are not same', () => {
        it('should return line width buckets', () => {
          vif.series[0].mapOptions.minimumLineWeight = 10;
          vif.series[0].mapOptions.maximumLineWeight = 18;
          vif.series[0].mapOptions.numberOfDataClasses = 4;
          vif.series[0].mapOptions.weighLinesBy = '__weigh_by__';

          let expectedResult = {
            type: 'interval',
            property: '__count__',
            default: 10,
            stops: [[20, 10], [60, 12], [100, 14], [140, 16], [180, 18]]
          };
          let resizeRangeBy = { min: 20, avg: 1, max: 180 };
          let decoratedVif = _.merge({}, lineMapVifDecorator, vif);
          let lineWidth = decoratedVif.getLineWidth('__count__', resizeRangeBy);

          assert.deepEqual(lineWidth, expectedResult);
        });
      });
    });
  });

  describe('lineColor', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
    });

    it('should return default lineColor if colorCategories are null', () => {
      let decoratedVif = _.merge({}, lineMapVifDecorator, vif);

      let lineColor = decoratedVif.getLineColor();
      assert.equal(lineColor, '#eb6900');
    });

    it('should return lineColor Buckets if colorCategories are not Null', () => {
      vif.series[0].color.palette = 'categorical';
      let decoratedVif = _.merge({}, lineMapVifDecorator, vif);

      let lineColor = decoratedVif.getLineColor('__color_by__', ['police', 'county', 'city', 'bus']);
      let expectedResult = {
        property: '__color_by__',
        type: 'categorical',
        stops: [['police', '#a6cee3'],
          ['county', '#5b9ec9'],
          ['city', '#2d82af'],
          ['bus', '#7eba98']],
        default: '#98d277'
      };
      assert.deepEqual(lineColor, expectedResult);
    });
  });
});
