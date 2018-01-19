import _ from 'lodash';
import Regions from 'common/visualizations/views/map/vifOverlays/partials/Regions';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('Regions', () => {
  let regions;
  let mockMap;
  let renderOptions;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy(),
      setPaintProperty: sinon.spy()
    };

    renderOptions = {
      dataUrl:'http://example.com',
      shapeColorConfigs: [{ shapeId: 1, color: 'red' }],
      shapePrimaryKey: '_feature_id'
    };
    regions = new Regions(mockMap);
  });

  describe('setup', () => {
    it('should addsource and add Layers to the map', () => {
      const vif = mapMockVif();
      regions.setup(vif, renderOptions);

      sinon.assert.calledWith(
        mockMap.addSource,
        'polygonVectorDataSource',
        sinon.match({
          'type': 'vector',
          'geojsonTile': true,
          'tiles': [renderOptions.dataUrl]
        }),
      );

      sinon.assert.calledWith(
        mockMap.addLayer,
        sinon.match({
          'id': 'shape-line',
          'type': 'fill',
          'source': 'polygonVectorDataSource',
          'source-layer': '_geojsonTileLayer',
          'paint': {
            'fill-color': {
              'type': 'categorical',
              'property': '_feature_id',
              'stops': [[1, 'red']]
            },
            'fill-outline-color': 'rgba(255, 255, 255, 1)'
          }
        }),
      );
    });
  });

  describe('update', () => {
    it('should update the map with given renderOptions', () => {
      const vif = mapMockVif({});

      regions.setup(vif, renderOptions);
      regions.update(vif, renderOptions);

      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'shape-line',
        'fill-color',
        sinon.match({
          'type': 'categorical',
          'property': '_feature_id',
          'stops': [[1, 'red']]
        })
      );
    });

    it('should destroy and setup if existing and new source options are different', () => {
      const vif = mapMockVif({});
      const newRenderOptions = _.cloneDeep(renderOptions);
      newRenderOptions.dataUrl = 'http://test.com';
      regions.setup(vif, renderOptions);

      regions.update(vif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'shape-line');
      sinon.assert.calledWith(mockMap.removeSource, 'polygonVectorDataSource');
    });
  });

});
