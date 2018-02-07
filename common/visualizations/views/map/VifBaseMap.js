import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

import { getBaseMapStyle } from './baseMapStyle';

const LAYER = {
  BASE_MAP_RASTER_LAYER: 'raster-base-map-tile'
};

/**
* Handles vif center/zoom init/updates.
* Handles vif baseLayer/baseMapStyle init/updates.
* Returns mapOptions with the above mentioned for mapCreation.
*/
export default class VifBaseMap {
  constructor(map) {
    this._map = map;
    this._existingVif = {};
  }

  initialize(vif) {
    this._existingVif = vif;
  }

  update(vif) {
    const mapOptions = VifBaseMap.getMapInitOptions(vif);
    const newBaseMapStyle = getBaseMapStyle(vif);
    const newBaseMapOpacity = getBaseMapOpacity(vif);

    if (getBaseMapStyle(this._existingVif) !== newBaseMapStyle) {
      this._map.setStyle(getStyleDef(vif));
    }

    if (getBaseMapOpacity(this._existingVif) !== newBaseMapOpacity && !isVectorTile(newBaseMapStyle)) {
      this._map.setPaintProperty(LAYER.BASE_MAP_RASTER_LAYER, 'raster-opacity', newBaseMapOpacity);
    }

    if (mapOptions.zoom && mapOptions.center) {
      this._map.flyTo({
        zoom: mapOptions.zoom,
        center: mapOptions.center,
        pitch: mapOptions.pitch,
        bearing: mapOptions.bearing
      });
    }
    this._existingVif = vif;
  }

  static getMapInitOptions(vif) {
    const center = _.get(vif, 'configuration.mapCenterAndZoom.center');
    const zoom = _.get(vif, 'configuration.mapCenterAndZoom.zoom');
    const pitch = _.get(vif, 'configuration.mapPitchAndBearing.pitch', 0);
    const bearing = _.get(vif, 'configuration.mapPitchAndBearing.bearing', 0);
    const centerAndZoomDefined = _.chain(vif).at(
      'configuration.mapCenterAndZoom.center.lat',
      'configuration.mapCenterAndZoom.center.lng',
      'configuration.mapCenterAndZoom.zoom'
    ).every(_.isNumber).value();

    if (centerAndZoomDefined) {
      return {
        center: new mapboxgl.LngLat(center.lng, center.lat),
        zoom: zoom,
        style: getStyleDef(vif),
        pitch: pitch,
        bearing: bearing
      };
    } else {
      return {
        style: getStyleDef(vif),
        pitch: pitch,
        bearing: bearing
      };
    }
  }
}

function getStyleDef(vif) {
  const style = getBaseMapStyle(vif);

  if (isVectorTile(style)) {
    return style;
  }

  return {
    'version' : 8,
    'glyphs' : 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    'sources': {
      'raster-tiles': {
        'type': 'raster',
        'tiles': [style],
        'tileSize': 256
      }
    },
    'layers': [{
      'id': LAYER.BASE_MAP_RASTER_LAYER,
      'type': 'raster',
      'source': 'raster-tiles',
      'minzoom': 0,
      'maxzoom': 22,
      'paint': {
        'raster-opacity': getBaseMapOpacity(vif)
      }
    }]
  };
}

function isVectorTile(style) {
  return (style + '').indexOf('mapbox://styles/') === 0;
}

function getBaseMapOpacity(vif) {
  return Number(_.get(vif, 'configuration.baseMapOpacity', 1));
}
