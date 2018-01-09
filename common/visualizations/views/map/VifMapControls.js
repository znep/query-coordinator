import _ from 'lodash';

import mapboxgl from 'mapbox-gl';

/**
* Handles vif map controls init/updates
*    - navigation control
*    - geolocate control
* Returns mapOptions with the above mentioned for mapCreation
*/
export default class VifMapControls {
  constructor(map) {
    this._map = map;
    this._geolocateControl = null;
  }

  initialize(vif) {
    this._map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    if (shouldShowGeolocateControl(vif)) {
      this._showLocateUser();
    }
  }

  update(vif) {
    if (shouldShowGeolocateControl(vif)) {
      this._showLocateUser();
    } else {
      this._hideLocateUser();
    }
  }

  static getMapInitOptions(vif) {
    return {};
  }

  _showLocateUser() {
    if (this._geolocateControl) {
      return;
    }
    this._geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    this._map.addControl(this._geolocateControl, 'bottom-right');
  }

  _hideLocateUser() {
    if (this._geolocateControl) {
      this._map.removeControl(this._geolocateControl);
      this._geolocateControl = null;
    }
  }
}

function shouldShowGeolocateControl(vif) {
  return _.get(vif, 'configuration.locateUser', true);
}
