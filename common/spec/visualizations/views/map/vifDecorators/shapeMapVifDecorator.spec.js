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
      const decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      assert.equal(
        decoratedVif.getShapeOutlineColor(),
        '#eb6900'
      );
    });

    it('should return default shape fillColor', () => {
      const decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      assert.equal(
        decoratedVif.getShapeFillColor('__color_by__', null),
        'rgba(0, 0, 0, 0)'
      );
    });
  });

  describe('shape line/fill color if colorCategories are empty', () => {
    it('should return first color of color palette ', () => {
      const decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      assert.equal(
        decoratedVif.getShapeFillColor('__color_by__', []),
        '#e41a1c'
      );
    });
  });

  describe('shape line/fill Color if colorCategories are not null', () => {
    it('should return shape lineColor', () => {
      vif.series[0].color.palette = 'categorical';
      const decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      const shapeLineColor = decoratedVif.getShapeOutlineColor(['department', 'place', 'city', 'school']);

      assert.deepEqual(shapeLineColor, '#ffffff');
    });

    it('should return shape fillColor Buckets', () => {
      vif.series[0].color.palette = 'categorical';
      const decoratedVif = _.merge({}, shapeMapVifDecorator, vif);

      const shapeFillColor = decoratedVif.getShapeFillColor('__color_by__', ['school', 'county', 'place']);
      const expectedResult = {
        property: '__color_by__',
        type: 'categorical',
        stops: [
          ['school', '#a6cee3'],
          ['county', '#5b9ec9'],
          ['place', '#2d82af']
        ],
        default: '#7eba98'
      };
      assert.deepEqual(shapeFillColor, expectedResult);
    });
  });
});
