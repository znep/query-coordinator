import _ from 'lodash';
import $ from 'jquery';
import Legend from 'common/visualizations/views/map/vifOverlays/partials/Legend';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('Legend', () => {
  const element = $('<div>', { 'id': 'unified-map-region', 'class': 'map' });
  let legend;
  let buckets;

  beforeEach(() => {
    legend = new Legend(element);
  });

  describe('show', () => {
    describe('type interval', () => {
      beforeEach(() => {
        buckets = [
          { start: 6, end: 121, color: '#e41a1c' },
          { start: 121, end: 135, color: '#cacaca' }
        ];
      });
      it('should render the map legend', () => {
        const vif = mapMockVif({});

        legend.show(buckets, 'interval');

        assert.isNotNull(element.find('.legend-container'));
        assert.equal(element.find('.bucket-color').length, 2);
        assert.equal(element.find('.interval-bucket-value').length, 2);
        assert.equal(element.find('.bucket-end-value').text(), 135);
        assert.equal(element.find('.interval-bucket-value').eq(0).text(), 121);
        assert.equal(element.find('.interval-bucket-value').eq(1).text(), 6);
        assert.equal(
          element.find('.map-bucket').eq(0).attr('style'),
          'height: 50%;'
        );
        assert.equal(
          element.find('.map-bucket').eq(1).attr('style'),
          'height: 50%;'
        );
        assert.equal(
          element.find('.bucket-color').eq(0).attr('style'),
          'background-color: #cacaca;'
        );
        assert.equal(
          element.find('.bucket-color').eq(1).attr('style'),
          'background-color: #e41a1c;'
        );
      });
    });

    describe('type categorical', () => {
      beforeEach(() => {
        buckets = [
          { category: 'Place', color: '#e41a1c' },
          { category: 'City', color: '#cacaca' },
          { category: 'Others', color: '#fcfcfc' }
        ];
      });
      it('should render the map legend', () => {
        const vif = mapMockVif({});

        legend.show(buckets, 'categorical');

        assert.isNotNull(element.find('.legend-container'));
        assert.equal(element.find('.bucket-color').length, 3);
        assert.equal(element.find('.categorical-bucket-value').length, 3);
        assert.equal(element.find('.categorical-bucket-value').eq(0).text(), 'Place');
        assert.equal(element.find('.categorical-bucket-value').eq(1).text(), 'City');
        assert.equal(element.find('.categorical-bucket-value').eq(2).text(), 'Others');
        assert.equal(
          element.find('.map-bucket').eq(0).attr('style'),
          'height: 33%;'
        );
        assert.equal(
          element.find('.map-bucket').eq(1).attr('style'),
          'height: 33%;'
        );
        assert.equal(
          element.find('.map-bucket').eq(2).attr('style'),
          'height: 33%;'
        );
        assert.equal(
          element.find('.bucket-color').eq(0).attr('style'),
          'background-color: #e41a1c;'
        );
        assert.equal(
          element.find('.bucket-color').eq(1).attr('style'),
          'background-color: #cacaca;'
        );
        assert.equal(
          element.find('.bucket-color').eq(2).attr('style'),
          'background-color: #fcfcfc;'
        );
      });
    });
  });

  describe('destroy', () => {
    it('should destroy the map legend', () => {
      legend.show();

      legend.destroy();
      assert.equal(element.find('.legend-container').length, 0);
    });
  });
});
