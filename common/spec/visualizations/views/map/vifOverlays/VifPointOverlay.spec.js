import VifPointOverlay from 'common/visualizations/views/map/vifOverlays/VifPointOverlay';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import { getBaseMapLayerStyles } from 'common/visualizations/views/map/baseMapStyle';

describe('VifPointOverlay', () => {
  let vifPointOverlay;
  let mockMap;
  let vif;
  const mapboxDarkMapStyle = 'mapbox://styles/mapbox/dark-v9';
  const darkMapConfig = getBaseMapLayerStyles({
    'configuration': {
      'baseMapStyle': mapboxDarkMapStyle
    }
  });
  const mapboxLightMapStyle = 'mapbox://styles/mapbox/light-v9';
  const lightMapConfig = getBaseMapLayerStyles({
    'configuration': {
      'baseMapStyle': mapboxLightMapStyle
    }
  });

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifPointOverlay = new VifPointOverlay(mockMap);
    vif = mapMockVif({
      configuration: {
        baseMapStyle: mapboxDarkMapStyle
      },
      series: [
        {
          color: {
            primary : '#ff00ff'
          },
          mapOptions: {
            'mapType': 'pointMap',
            'clusterRadius': 80,
            'stackRadius': 20,
            'maxClusterSize': 40,
            'maxClusteringZoomLevel': 11,
            'pointMapPointSize': 10
          }
        }
      ]
    });
  });

  describe('setup', () => {
    beforeEach(() => {
      vifPointOverlay.setup(vif);
    });

    it('should add the stack/point sources with clusterRadius from vif', () => {
      sinon.assert.calledWith(mockMap.addSource,
        'pointVectorDataSource',
        sinon.match({
          geojsonTile: true,
          cluster: true,
          clusterRadius: 20
        })
      );
    });

    it('should add point layer with point color/radius from vif', () => {
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'point',
          paint: {
            'circle-color': '#ff00ff',
            'circle-radius': 5
          }
        }),
      );
    });

    it('should add the map stacks layer with darkStyleMap\'s style config', () => {
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'stack-circle',
          paint: ({
            'circle-color': darkMapConfig.STACK_COLOR,
            'circle-radius': darkMapConfig.STACK_SIZE / 2,
            'circle-stroke-color': darkMapConfig.STACK_BORDER_COLOR,
            'circle-stroke-opacity': darkMapConfig.STACK_BORDER_OPACITY,
            'circle-stroke-width': darkMapConfig.STACK_BORDER_SIZE
          })
        }),
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'stack-count-label',
          paint: sinon.match({
            'text-color': darkMapConfig.STACK_TEXT_COLOR
          })
        }),
      );
    });

    it('should add the cluster sources with clusterRadius from vif', () => {
      sinon.assert.calledWith(mockMap.addSource,
        'clustersVectorDataSource',
        sinon.match({
          geojsonTile: true,
          cluster: true,
          clusterRadius: 80
        })
      );
    });

    it('should add the cluster layer with darkStyleMap\'s style config', () => {
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'clustersVectorDataSource',
          id: 'cluster-circle',
          paint: sinon.match({
            'circle-color': darkMapConfig.CLUSTER_COLOR,
            'circle-radius': sinon.match({
              default: 12,
              property: 'sum',
              stops: [[0, 12], [100, 16], [1000, 20]],
              type: 'interval'
            }),
            'circle-stroke-color': darkMapConfig.CLUSTER_BORDER_COLOR,
            'circle-stroke-opacity': darkMapConfig.CLUSTER_BORDER_OPACITY,
            'circle-stroke-width': darkMapConfig.CLUSTER_BORDER_SIZE
          })
        }),
      );
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'clustersVectorDataSource',
          id: 'cluster-count-label',
          paint: sinon.match({
            'text-color': darkMapConfig.CLUSTER_TEXT_COLOR
          })
        }),
      );
    });
  });

  describe('update source options(clusterRadius)', () => {
    it('should resetup', () => {
      vifPointOverlay.setup(vif);
      let modifiedVif = mapMockVif({
        series: [
          {
            mapOptions: {
              maxClusteringZoomLevel: 15
            }
          }
        ]
      });
      sinon.spy(vifPointOverlay, 'setup');

      vifPointOverlay.update(modifiedVif);

      sinon.assert.calledWith(vifPointOverlay.setup, modifiedVif);
    });
  });

  describe('update vif', () => {
    let newVif;
    beforeEach(() => {
      newVif = mapMockVif({
        configuration: {
          baseMapStyle: mapboxLightMapStyle
        },
        series: [
          {
            color: {
              primary : 'red'
            },
            mapOptions: {
              'mapType': 'pointMap',
              'clusterRadius': 80,
              'stackRadius': 20,
              'maxClusterSize': 40,
              'maxClusteringZoomLevel': 11,
              'pointMapPointSize': 10
            }
          }
        ]
      });

      vifPointOverlay.setup(vif);
      vifPointOverlay.update(newVif);
    });

    it('should update the points to new color from newvif', () => {
      sinon.assert.calledWith(mockMap.setPaintProperty, 'point', 'circle-color', 'red');
      sinon.assert.calledWith(mockMap.setPaintProperty, 'point', 'circle-radius', 5);
    });

    it('should update the stacks based on new vif', () => {

      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-circle',
        'circle-radius',
        lightMapConfig.STACK_SIZE / 2
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-circle',
        'circle-color',
        lightMapConfig.STACK_COLOR
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-circle',
        'circle-stroke-width',
        lightMapConfig.STACK_BORDER_SIZE
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-circle',
        'circle-stroke-color',
        lightMapConfig.STACK_BORDER_COLOR
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-circle',
        'circle-stroke-opacity',
        lightMapConfig.STACK_BORDER_OPACITY
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'stack-count-label',
        'text-color',
        lightMapConfig.STACK_TEXT_COLOR
      );
    });

    it('should update the clusters based on new vif', () => {
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-circle',
        'circle-radius',
        sinon.match({
          default: 12,
          type: 'interval',
          property: 'sum',
          stops: [[0, 12], [100, 16], [1000, 20]]
        })
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-circle',
        'circle-color',
        lightMapConfig.CLUSTER_COLOR
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-circle',
        'circle-stroke-width',
        lightMapConfig.CLUSTER_BORDER_SIZE
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-circle',
        'circle-stroke-color',
        lightMapConfig.CLUSTER_BORDER_COLOR
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-circle',
        'circle-stroke-opacity',
        lightMapConfig.CLUSTER_BORDER_OPACITY
      );
      sinon.assert.calledWith(
        mockMap.setPaintProperty,
        'cluster-count-label',
        'text-color',
        lightMapConfig.CLUSTER_TEXT_COLOR
      );
    });

  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      assert.equal(
        vifPointOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select count(*),snap_for_zoom(point,{snap_zoom}) ' +
        'where {{\'point\' column condition}} ' +
        'group by snap_for_zoom(point, {snap_zoom}) ' +
        'limit 100000 ' +
        '#substituteSoqlParams_tileParams={z}|{x}|{y}'
      );
    });
  });

});
