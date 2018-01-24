import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

import VifMapControls from 'common/visualizations/views/map/VifMapControls';
import { mapMockVif } from './../../mapMockVif';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

describe('VifMapControls', () => {
  let vifMapControls;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addControl: sinon.spy(),
      removeControl: sinon.spy()
    };
    vifMapControls = new VifMapControls(mockMap);
  });

  it('should show Navigation controls by default', () => {
    vifMapControls.initialize(mapMockVif());

    sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.NavigationControl));
  });

  describe('geo location', () => {
    it('should show geo locate control if geoLocateControl is true', () => {
      const initialVif = mapMockVif({
        configuration: {
          'geoLocateControl': false
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.neverCalledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));

      const vif = mapMockVif({
        configuration: {
          'geoLocateControl': true
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));
    });

    it('should hide geo locate control if geoLocateControl is false', () => {
      const initialVif = mapMockVif({
        configuration: {
          'geoLocateControl': true
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));

      const vif = mapMockVif({
        configuration: {
          'geoLocateControl': false
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.removeControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));
    });
  });

  describe('geo coder', () => {
    it('should show geo coder control if geoCoderControl is true', () => {
      const initialVif = mapMockVif({
        configuration: {
          'geoCoderControl': false
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.neverCalledWith(mockMap.addControl, sinon.match.instanceOf(MapboxGeocoder));

      const vif = mapMockVif({
        configuration: {
          'geoCoderControl': true
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(MapboxGeocoder));
    });

    it('should hide geo coder control if geoCoderControl is false', () => {
      const initialVif = mapMockVif({
        configuration: {
          'geoCoderControl': true
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(MapboxGeocoder));

      const vif = mapMockVif({
        configuration: {
          'geoCoderControl': false
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.removeControl, sinon.match.instanceOf(MapboxGeocoder));
    });
  });

});
