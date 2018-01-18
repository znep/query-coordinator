import _ from 'lodash';
import $ from 'jquery';
import RegionMapLegend from 'common/visualizations/views/map/vifOverlays/partials/RegionMapLegend';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('RegionMapLegend', () => {
  let element = $('<div>', { 'id': 'unified-map-region', 'class': 'map' });
  let regionMapLegend;
  let renderOptions;

  beforeEach(() => {
    renderOptions = {
      measures: [
        { shapeId: '1', value: 6 },
        { shapeId: '2', value: 121 },
        { shapeId: '3', value: 135 }
      ],
      shapeColorConfigs: [
        { shapeId: 1, color: '#e41a1c' },
        { shapeId: 2, color: '#e41a1c' },
        { shapeId: 3, color: '#cacaca' }
      ],
      buckets: [
        { start: 6, end: 121, color: '#e41a1c' },
        { start: 121, end: 135, color: '#cacaca' }
      ],
      dataUrl:'http://example.com',
      shapePrimaryKey: '_feature_id'
    };
    regionMapLegend = new RegionMapLegend(element);
  });

  describe('show', () => {
    it('should render the region map legend', () => {
      const vif = mapMockVif({});

      regionMapLegend.show(vif, renderOptions);

      assert.isNotNull(element.find('.region-map-legend-container'));
      assert.equal(element.find('.bucket-color').length, 2);
      assert.equal(element.find('.bucket-value').length, 2);
      assert.equal(element.find('.bucket-end-value').text(), 135);
      assert.equal(element.find('.bucket-value').eq(0).text(), 121);
      assert.equal(element.find('.bucket-color').eq(0).attr('style'),
        'background-color: #cacaca;');
      assert.equal(element.find('.bucket-value').eq(1).text(), 6);
      assert.equal(element.find('.bucket-color').eq(1).attr('style'),
        'background-color: #e41a1c;');
    });
  });
});
