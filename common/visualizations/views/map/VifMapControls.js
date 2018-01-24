import _ from 'lodash';

import mapboxgl from 'mapbox-gl';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { GEO_LOCATE_CONTROL_OPTIONS, MAP_CONTROLS_POSITION } from '../mapConstants';

/**
* Handles vif map controls init/updates
*    - navigation control
*    - geolocate control
* Returns mapOptions with the above mentioned for mapCreation
*/
export default class VifMapControls {
  constructor(map) {
    this._map = map;
    this._geoLocateControl = null;
    this._geoCoderControl = null;
    this._navigationControl = null;
    this._existingVif = null;
  }

  initialize(vif) {
    if (shouldShowNavigationControl(vif)) {
      this._showNavigationControl();
    }
    if (shouldShowGeoLocateControl(vif)) {
      this._showGeoLocateControl();
    }
    if (shouldShowGeoCoderControl(vif)) {
      this._showGeoCoderControl();
    }
  }

  update(vif) {
    shouldShowNavigationControl(vif) ? this._showNavigationControl() : this._hideNavigationControl();
    shouldShowGeoLocateControl(vif) ? this._showGeoLocateControl() : this._hideGeoLocateControl();
    shouldShowGeoCoderControl(vif) ? this._showGeoCoderControl() : this._hideGeoCoderControl();
  }

  static getMapInitOptions(vif) {
    return {};
  }

  _showNavigationControl() {
    if (this._navigationControl) {
      return;
    }
    this._navigationControl = new mapboxgl.NavigationControl();
    this._map.addControl(this._navigationControl, MAP_CONTROLS_POSITION.NAVIGATION);
  }

  _hideNavigationControl() {
    if (!this._navigationControl) {
      return;
    }
    this._map.removeControl(this._navigationControl);
    this._navigationControl = null;
  }

  _showGeoLocateControl() {
    if (this._geoLocateControl) {
      return;
    }
    this._geoLocateControl = new mapboxgl.GeolocateControl(GEO_LOCATE_CONTROL_OPTIONS);
    this._map.addControl(this._geoLocateControl, MAP_CONTROLS_POSITION.GEO_LOCATE);
  }

  _hideGeoLocateControl() {
    if (!this._geoLocateControl) {
      return;
    }
    this._map.removeControl(this._geoLocateControl);
    this._geoLocateControl = null;
  }

  _showGeoCoderControl() {
    if (this._geoCoderControl) {
      return;
    }
    this._geoCoderControl = new MapboxGeocoder({ accessToken: mapboxgl.accessToken });
    this._map.addControl(this._geoCoderControl, MAP_CONTROLS_POSITION.GEO_CODER);
  }

  _hideGeoCoderControl() {
    if (!this._geoCoderControl) {
      return;
    }
    this._map.removeControl(this._geoCoderControl);
    this._geoCoderControl = null;
  }
}

function shouldShowNavigationControl(vif) {
  return _.get(vif, 'configuration.navigationControl', true);
}

function shouldShowGeoLocateControl(vif) {
  return _.get(vif, 'configuration.geoLocateControl', true);
}

function shouldShowGeoCoderControl(vif) {
  return _.get(vif, 'configuration.geoCoderControl', true);
}
