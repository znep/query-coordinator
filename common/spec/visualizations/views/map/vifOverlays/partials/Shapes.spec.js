import _ from 'lodash';
import Shapes from 'common/visualizations/views/map/vifOverlays/partials/Shapes';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('Clusters', () => {
  let shapes;
  let mockMap;
  let renderOptions;
  let vif;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };

    renderOptions = {
      colorBy: '__color_by_category__',
      colorByCategories: null,
      layerStyles: {
        INSERT_FILL_LAYERS_BEFORE: 'waterway-label'
      }
    };
    vif = mapMockVif({});
    shapes = new Shapes(mockMap);
  });

  describe('setup', () => {
    it('should add the source and layers', () => {
      shapes.setup(vif, renderOptions);

      sinon.assert.calledWith(mockMap.addSource, 'polygonVectorDataSource', sinon.match({
        'type': 'vector',
        'geojsonTile': true,
        'tiles': [renderOptions.dataUrl]
      }),
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'shape-line',
          paint: { 'line-color': '#eb6900', 'line-width': 2 },
          source: 'polygonVectorDataSource',
          'source-layer': '_geojsonTileLayer',
          type: 'line'
        }),
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'shape-fill',
          paint: { 'fill-color': 'rgba(0, 0, 0, 0)', 'fill-outline-color': 'rgba(0, 0, 0, 0)' },
          source: 'polygonVectorDataSource',
          'source-layer': '_geojsonTileLayer',
          type: 'fill'
        }),
      );
    });
  });

  describe('update', () => {
    it('should update the map with vif/renderOptions', () => {
      shapes.setup(vif, renderOptions);
      shapes.update(vif, renderOptions);

      sinon.assert.calledWith(mockMap.setPaintProperty, 'shape-line', 'line-color', '#eb6900');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'shape-fill', 'fill-color', 'rgba(0, 0, 0, 0)');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'shape-fill', 'fill-outline-color', '#ffffff');
    });

    it('should destroy and setup if existing and new source options are different', () => {
      const newRenderOptions = _.cloneDeep(renderOptions);
      const newVif = mapMockVif({
        series: [{
          color: { primary: 'green' }
        }]
      });
      newRenderOptions.dataUrl = 'example.com';
      shapes.setup(vif, renderOptions);
      shapes.update(newVif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'shape-line');
      sinon.assert.calledWith(mockMap.removeSource, 'polygonVectorDataSource');
    });
  });

  describe('destroy', () => {
    it('should destroy sources and layers', () => {
      shapes.setup(vif, renderOptions);

      shapes.destroy();

      sinon.assert.calledWith(mockMap.removeLayer, 'shape-line');
      sinon.assert.calledWith(mockMap.removeLayer, 'shape-fill');
      sinon.assert.calledWith(mockMap.removeSource, 'polygonVectorDataSource');
    });
  });
});
