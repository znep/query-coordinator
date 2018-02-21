import _ from 'lodash';

import HeatClusters from 'common/visualizations/views/map/vifOverlays/partials/HeatClusters';
import { getBaseMapLayerStyles } from 'common/visualizations/views/map/baseMapStyle';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('HeatClusters', () => {
  let heatClusters;
  let mockMap;
  let renderOptions;
  let vif;

  beforeEach(() => {
    vif = mapMockVif({});
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };

    renderOptions = {
      layerStyles:getBaseMapLayerStyles(vif)
    };

    heatClusters = new HeatClusters(mockMap);
  });

  describe('setup', () => {
    it('should add source and Layers to the map', () => {
      heatClusters.setup(vif, renderOptions);

      sinon.assert.calledWith(mockMap.addSource, 'heatVectorDataSource', sinon.match({
        type: 'vector',
        geojsonTile: true
      }));

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'heatVectorDataSource',
          id: 'heatLayer',
          'source-layer': '_geojsonTileLayer',
          type: 'heatmap',
          paint: {
            'heatmap-weight': sinon.match({
              'property': 'count',
              'type': 'exponential'
            })
          }
        })
        );
    });
  });

  describe('update', () => {
    it('should destroy and setup if existing and new source options are different', () => {
      const newRenderOptions = _.cloneDeep(renderOptions);

      const newVif = mapMockVif({
        series: [{
          color: { primary: 'green' }
        }]
      });

      newRenderOptions.dataUrl = '';

      heatClusters.setup(vif, renderOptions);
      heatClusters.update(newVif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'heatLayer');
      sinon.assert.calledWith(mockMap.removeSource, 'heatVectorDataSource');
      sinon.assert.calledWith(mockMap.addSource, 'heatVectorDataSource', sinon.match({}));
      sinon.assert.calledWith(mockMap.addLayer, sinon.match({ id: 'heatLayer' }));
    });
  });

  describe('destroy', () => {
    it('should destroy the sources and layers', () => {
      heatClusters.setup(vif, renderOptions);

      heatClusters.destroy();

      sinon.assert.calledWith(mockMap.removeLayer, 'heatLayer');
      sinon.assert.calledWith(mockMap.removeSource, 'heatVectorDataSource');
    });
  });
});

