import _ from 'lodash';
import mapboxgl from 'mapbox-gl';
import VifBaseMap from 'common/visualizations/views/map/VifBaseMap';
import { mapMockVif } from './../../mapMockVif';

describe('VifBaseMap', () => {
  describe('update', () => {
    let vifBaseMap;
    let mockMap;

    beforeEach(() => {
      mockMap = {
        flyTo: sinon.spy(),
        setStyle: sinon.spy(),
        setPaintProperty: sinon.spy()
      };
      vifBaseMap = new VifBaseMap(mockMap);

      const initialVif = mapMockVif({
        configuration: {
          'baseMapStyle': 'mapbox://styles/mapbox/light-v9'
        }
      });
      vifBaseMap.initialize(initialVif);
    });


    it('should update style is configuration.baseMapStyle changed', () => {
      const vif = mapMockVif({
        configuration: {
          'baseMapStyle': 'mapbox://styles/mapbox/dark-v9'
        }
      });

      vifBaseMap.update(vif);
      sinon.assert.calledWith(mockMap.setStyle, 'mapbox://styles/mapbox/dark-v9');
    });


    it('should not update style is configuration.baseMapStyle not changed', () => {
      const vif = mapMockVif({
        configuration: {
          'baseMapStyle': 'mapbox://styles/mapbox/light-v9'
        }
      });

      vifBaseMap.update(vif);
      sinon.assert.neverCalledWith(mockMap.setStyle, 'mapbox://styles/mapbox/dark-v9');
    });

    describe('map opacity configured', () => {
      it('should update options with configured map opacity', () => {
        const vif = mapMockVif({
          configuration: {
            'baseMapOpacity': 0.5,
            'baseMapStyle': 'dark-v9'
          }
        });
        vifBaseMap._existingVif = mapMockVif({
          configuration: {
            'baseMapOpacity': 1,
            'baseMapStyle': 'mapbox://styles/mapbox/light-v9'
          }
        });

        vifBaseMap.update(vif);
        sinon.assert.calledWith(mockMap.setPaintProperty, 'raster-base-map-tile', 'raster-opacity', 0.5);
      });
    });

    describe('vif with center and zoom', () => {
      it('should call the flyTo function', () => {
        const vif = mapMockVif({
          configuration: {
            mapCenterAndZoom: {
              center: { lat: 47.596, lng: -122.328 },
              zoom: 17
            }
          }
        });
        vifBaseMap.update(vif);

        sinon.assert.calledWith(mockMap.flyTo, {
          zoom: 17,
          center: { lat: 47.596, lng: -122.328 }
        });
      });
    });

    describe('vif without center and zoom', () => {
      it('should not call the flyTo function', () => {
        const vif = mapMockVif({
          configuration: {
            mapCenterAndZoom: {
              center: null,
              zoom: 17
            }
          }
        });
        vifBaseMap.update(vif);

        sinon.assert.notCalled(mockMap.flyTo);
      });
    });
  });

  describe('getMapInitOptions', () => {
    describe('options.style', () => {
      describe('map style configured', () => {
        it('should configured map style for mapbox vector tile', () => {
          const vif = mapMockVif({
            configuration: {
              'baseMapStyle': 'mapbox://styles/mapbox/dark-v9'
            }
          });

          const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

          assert.equal(mapInitOptions.style, 'mapbox://styles/mapbox/dark-v9');
        });

        it('should style def for raster tiles', () => {
          const vif = mapMockVif({
            configuration: {
              'baseMapStyle': 'dark-v9'
            }
          });

          const mapInitOptions = VifBaseMap.getMapInitOptions(vif);
          assert.deepEqual(
            mapInitOptions.style, {
              'version': 8,
              'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
              'sources': {
                'raster-tiles': {
                  'type': 'raster',
                  'tiles': ['dark-v9'],
                  'tileSize': 256
                }
              },
              'layers': [{
                'id': 'raster-base-map-tile',
                'type': 'raster',
                'source': 'raster-tiles',
                'minzoom': 0,
                'maxzoom': 22,
                'paint': {
                  'raster-opacity': 1
                }
              }]
            }
          );
        });
      });

      it('should return default style if configuration.baseMapStyle not set', () => {
        const vif = mapMockVif();
        vif.configuration.baseMapStyle = undefined;

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.equal(mapInitOptions.style, 'mapbox://styles/mapbox/basic-v9');
      });
    });

    describe('map center and zoom configured', () => {
      it('should return configured map center and zoom', () => {
        const vif = mapMockVif({
          configuration: {
            mapCenterAndZoom:{
              center: { lat: 47.596, lng: -122.328 },
              zoom: 17
            }
          }
        });

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.equal(mapInitOptions.zoom, 17);
        assert.equal(mapInitOptions.center.lng, -122.328);
        assert.equal(mapInitOptions.center.lat, 47.596);
      });
    });

    describe('map center not configured', () => {
      it('should not return the map center and zoom', () => {
        const vif = mapMockVif({
          configuration: {
            mapCenterAndZoom:{
              zoom: 17
            }
          }
        });

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.isUndefined(mapInitOptions.center);
        assert.isUndefined(mapInitOptions.zoom);
      });
    });

    describe('map zoom not configured', () => {
      it('should not return the map center and zoom', () => {
        const vif = mapMockVif({
          configuration: {
            mapCenterAndZoom:{
              center: { lat: 47.596, lng: -122.328 }
            }
          }
        });

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.isUndefined(mapInitOptions.center);
        assert.isUndefined(mapInitOptions.zoom);
      });
    });

  });
});
