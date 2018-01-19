import _ from 'lodash';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import * as shapeMapVifDecorator from 'common/visualizations/views/map/vifDecorators/shapeMapVifDecorator';


describe('shapeMapVifDecorator', () => {
  let vif;
  beforeEach(() => {
    vif = mapMockVif({});
  });

  describe('shape line/fill color if colorCategories are null', () => {
    it('should return default shape lineColor', () => {
      let decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      let shapeLineColor = decoratedVif.getShapeLineColor();
      assert.equal(shapeLineColor, '#eb6900');
    });

    it('should return default shape fillColor', () => {
      let decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      let shapeFillColor = decoratedVif.getShapeFillColor();
      assert.equal(shapeFillColor, 'rgba(0, 0, 0, 0)');
    });
  });

  describe('shape line/fill Color if colorCategories are not null', () => {
    it('should return shape lineColor', () => {
      vif.series[0].color.palette = 'categorical';
      let decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      let shapeLineColor = decoratedVif.getShapeLineColor(['department', 'place', 'city', 'school']);

      assert.deepEqual(shapeLineColor, 'rgba(0, 0, 0, 0)');
    });

    it('should return shape fillColor Buckets', () => {
      vif.series[0].color.palette = 'categorical';
      let decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      let shapeFillColor = decoratedVif.getShapeFillColor('__color_by__', ['school', 'county', 'place']);
      let expectedResult = {
        property: '__color_by__',
        type: 'categorical',
        stops: [['school', '#a6cee3'],
          ['county', '#5b9ec9'],
          ['place', '#2d82af']],
        default: '#7eba98'
      };
      assert.deepEqual(shapeFillColor, expectedResult);
    });
  });

});
