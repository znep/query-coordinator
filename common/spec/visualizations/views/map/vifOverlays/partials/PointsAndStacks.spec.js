import _ from 'lodash';
import PointsAndStacks from 'common/visualizations/views/map/vifOverlays/partials/PointsAndStacks';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('PointsAndStacks', () => {
  let pointsAndStacks;
  let mockMap;
  let renderOptions;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setFilter: sinon.spy(),
      setPaintProperty: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };

    renderOptions = {
      countBy: '__count_by__',
      colorBy: '__color_by_category__',
      colorByCategories: null,
      aggregateAndResizeBy: '__resize_by__',
      resizeByRange: { avg: 1, max: 1, min: 0 },
      layerStyles: {
        STACK_BORDER_COLOR: '#046c8f',
        STACK_BORDER_OPACITY: 0.8,
        STACK_BORDER_SIZE: 2,
        STACK_COLOR: '#ffffff',
        STACK_SIZE: 24,
        STACK_TEXT_COLOR: '#656565'
      }
    };

    pointsAndStacks = new PointsAndStacks(mockMap);
  });

  describe('setup', () => {
    it('should add the map sources/layers', () => {
      const vif = mapMockVif();
      pointsAndStacks.setup(vif, renderOptions);

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'stack-circle',
          'source-layer': '_geojsonTileLayer',
          type: 'circle',
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': 12,
            'circle-stroke-color': '#046c8f',
            'circle-stroke-opacity': 0.8,
            'circle-stroke-width': 2
          }
        })
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'stack-count-label',
          type: 'symbol',
          layout: { 'text-allow-overlap': true, 'text-field': '{__count_by___abbrev}', 'text-size': 12 },
          paint: sinon.match({ 'text-color': '#656565' }),
          source: 'pointVectorDataSource',
          'source-layer': '_geojsonTileLayer'
        }),
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'point',
          source: 'pointVectorDataSource',
          'source-layer': '_geojsonTileLayer',
          type: 'circle',
          paint: { 'circle-color': '#eb6900', 'circle-opacity': 1, 'circle-radius': 5 }
        }),
      );
    });
  });

  describe('update', () => {
    it('should update the map for given renderOptions/vif', () => {
      const vif = mapMockVif({});

      pointsAndStacks.setup(vif, renderOptions);
      pointsAndStacks.update(vif, renderOptions);

      sinon.assert.calledWith(mockMap.setFilter, 'point', ['all', ['!has', 'point_count'], ['in', '__count_by__', 1, '1']]);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'point', 'circle-color', '#eb6900');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'point', 'circle-radius', 5);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'point', 'circle-opacity', 1);

      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-circle', 'circle-radius', 12);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-circle', 'circle-color', '#ffffff');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-circle', 'circle-stroke-width', 2);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-circle', 'circle-stroke-color', '#046c8f');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-circle', 'circle-stroke-opacity', 0.8);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'stack-count-label', 'text-color', '#656565');
    });

    it('should destroy and setup if existing and new source options are different', () => {
      let newRenderOptions = _.cloneDeep(renderOptions);
      const vif = mapMockVif({});
      const newVif = mapMockVif({
        series: [{
          color: { primary: 'green' }
        }]
      });
      newRenderOptions.aggregateAndResizeBy = '__new_column__';
      pointsAndStacks.setup(vif, renderOptions);
      pointsAndStacks.update(newVif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'stack-circle');
      sinon.assert.calledWith(mockMap.removeLayer, 'stack-count-label');
      sinon.assert.calledWith(mockMap.removeLayer, 'point');
      sinon.assert.calledWith(mockMap.removeSource, 'pointVectorDataSource');
    });
  });
});

