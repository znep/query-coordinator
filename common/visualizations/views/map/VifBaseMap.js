import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

/**
* Handles vif center/zoom init/updates.
* Handles vif baseLayer/baseMapStyle init/updates.
* Returns mapOptions with the above mentioned for mapCreation.
*/
export default class VifBaseMap {
  constructor(map) {
    this._map = map;
  }

  initialize(vif) {
    // TODO: If empty after map implementation, to be removed.
  }

  update(vif) {
    const mapOptions = VifBaseMap.getMapInitOptions(vif);

    if (mapOptions.zoom && mapOptions.center) {
      this._map.flyTo({
        zoom: mapOptions.zoom,
        center: mapOptions.center
      });
    }
  }

  static getMapInitOptions(vif) {
    const center = _.get(vif, 'configuration.mapCenterAndZoom.center');
    const zoom = _.get(vif, 'configuration.mapCenterAndZoom.zoom');
    const centerAndZoomDefined = _.chain(vif).at(
      'configuration.mapCenterAndZoom.center.lat',
      'configuration.mapCenterAndZoom.center.lng',
      'configuration.mapCenterAndZoom.zoom'
    ).every(_.isNumber).value();

    if (centerAndZoomDefined) {
      return {
        center: new mapboxgl.LngLat(center.lng, center.lat),
        zoom: zoom,
        style: getMapStyle(vif)
      };
    } else {
      return {
        style: getMapStyle(vif)
      };
    }
  }
}

function getMapStyle(vif) {
  return _.get(vif, 'configuration.baseMapStyle', 'mapbox://styles/mapbox/light-v9');
}
