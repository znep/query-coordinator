import _ from 'lodash';
import mapboxgl from 'mapbox-gl';
import VifBaseMap from 'common/visualizations/views/map/VifBaseMap';
import { mapMockVif } from './../../mapMockVif';

describe('VifBaseMap', () => {

  describe('update', () => {
    let vifBaseMap;
    let mockMap;

    beforeEach(() => {
      mockMap = { flyTo: sinon.spy() };
      vifBaseMap = new VifBaseMap(mockMap);
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
    describe('map style configured', () => {
      it('should return options with configured map style', () => {
        const vif = mapMockVif({
          configuration: {
            'baseMapStyle': 'mapbox://styles/mapbox/dark-v9'
          }
        });

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.equal(mapInitOptions.style, 'mapbox://styles/mapbox/dark-v9');
      });
    });

    describe('map style not configured', () => {
      it('should return options with default style ', () => {
        const vif = mapMockVif();
        vif.configuration.baseMapStyle = undefined;

        const mapInitOptions = VifBaseMap.getMapInitOptions(vif);

        assert.equal(mapInitOptions.style, 'mapbox://styles/mapbox/light-v9');
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
