import _ from 'lodash';
import Clusters from 'common/visualizations/views/map/vifOverlays/partials/Clusters';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('Clusters', () => {
  let clusters;
  let mockMap;
  let renderOptions;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };

    renderOptions = {
      aggregateAndResizeBy: '__resize_by__',
      resizeByRange: { avg: 1, max: 1, min: 0 },
      layerStyles: {
        CLUSTER_BORDER_COLOR: '#003b4d',
        CLUSTER_BORDER_OPACITY: 0.8,
        CLUSTER_BORDER_SIZE: 2,
        CLUSTER_COLOR: '#046c8f',
        CLUSTER_TEXT_COLOR: '#ffffff'
      }
    };

    clusters = new Clusters(mockMap);
  });

  describe('setup', () => {
    it('should add the map sources/layers', () => {
      const vif = mapMockVif();
      clusters.setup(vif, renderOptions);

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'clustersVectorDataSource',
          id: 'cluster-circle',
          'source-layer': '_geojsonTileLayer'
        })
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'cluster-count-label',
          layout: sinon.match({
            'text-allow-overlap': true,
            'text-field': '{sum_abbrev}{__resize_by__}',
            'text-size': 12
          }),
          paint: { 'text-color': '#ffffff' },
          source: 'clustersVectorDataSource',
          'source-layer': '_geojsonTileLayer',
          type: 'symbol'
        }),
      );
    });
  });

  describe('update', () => {
    it('should update the map for the given renderOptions/vif', () => {
      const vif = mapMockVif({});

      clusters.setup(vif, renderOptions);
      clusters.update(vif, renderOptions);

      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-radius',
        sinon.match({ default: 12, type: 'interval', property: 'sum', stops: [[0, 12], [100, 16], [1000, 20]] })
      );
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-color', '#046c8f');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-stroke-width', 2);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-stroke-color', '#003b4d');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-stroke-opacity', 0.8);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-count-label', 'text-color', '#ffffff');
    });

    it('should destroy and setup if existing and new source options are different', () => {
      let newRenderOptions = _.cloneDeep(renderOptions);
      const vif = mapMockVif({});
      const newVif = mapMockVif({
        series: [{
          color: { primary: 'green' }
        }]
      });
      newRenderOptions.aggregateAndResizeBy = '__count_by__';
      clusters.setup(vif, renderOptions);
      clusters.update(newVif, newRenderOptions);

      sinon.assert.calledWith(mockMap.removeLayer, 'cluster-circle');
      sinon.assert.calledWith(mockMap.removeLayer, 'cluster-count-label');
      sinon.assert.calledWith(mockMap.removeSource, 'clustersVectorDataSource');
    });
  });
});

