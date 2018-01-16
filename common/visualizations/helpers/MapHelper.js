import mapboxgl from 'mapbox-gl';
import { TILE_URL_OPTIONS } from '../views/mapConstants';

export default class MapHelper {
  static afterMapLoad(map, callback) {
    if (map.loaded()) {
      callback();
    } else {
      map.once('render', (mapDataEvent) => {
        MapHelper.afterMapLoad(map, callback);
      });
    }
  }

  static substituteSoqlParams(tileUrl) {
    const tileParams = getTileParams(tileUrl);

    if (tileParams === null) {
      return {
        url: tileUrl
      };
    }

    const tilePolygonWKT = tilePolygonString(tileParams);
    const transformedUrl = tileUrl
      .replace(/{{'(.*)' column condition}}/g, function(entireMatch, columnId) {
        return `intersects(${columnId}, '${tilePolygonWKT}')`;
      })
      .replace(/{snap_zoom}/g, getSnapZoom(tileParams))
      .replace(/{snap_precision}/g, getSnapPrecision(tileParams))
      .replace(/{simplify_precision}/g, getSnapPrecision(tileParams));

    return {
      url: transformedUrl
    };
  }
}

// Given a tile url template: https://a.domain.com/tiles/{z}/{x}/{y}
// mapbox will substiture {z},{x},{y} with zoom,x,y
// then call the supplied transformRequest on the url
// then fetch tiles and display them on map.
//
// If substituteSoqlParams will be given as options.transformRequest to mapbox,
// it will infer the tiles z,x,y based on 'substituteSoqlParams_tileParams={z}|{x}|{y}'
// and it will replace the below in each tile url.
// * {{'point' column condition}} : intersects(point, 'POLYGON((90.00 20.00, .....))')
// * snapZoom : snapZoom value for tile's zoom
// * snapPrecision : snapPrecision value for tile's zoom
// * simplifyPrecision : simplifyPrecision value for tile's zoom

function getTileParams(tileUrl) {
  const match = tileUrl.match(/#substituteSoqlParams_tileParams=(\d+)\|(\d+)\|(\d+)/);
  if (match) {
    return {
      z: Number(match[1]),
      x: Number(match[2]),
      y: Number(match[3])
    };
  } else {
    return null;
  }
}

function getSnapZoom(tileParams) {
  const zoom = tileParams.z;
  const defaultSnapZoom = Math.max(zoom - 6, 1);
  const snapZoomOption = TILE_URL_OPTIONS.snapZoom || {};

  return snapZoomOption[zoom] || defaultSnapZoom;
}

function getSnapPrecision(tileParams) {
  const zoom = tileParams.z;
  const defaultSnapPrecision = 0.0001 / (2 * zoom);
  const snapPrecisionOption = TILE_URL_OPTIONS.snapPrecision || {};

  return Math.max(snapPrecisionOption[zoom] || defaultSnapPrecision, 0.0000001);
}

function getSimplifyPrecision(tileParams) {
  const zoom = tileParams.z;
  const defaultSimplifyPrecision = 0.0001 / (2 * zoom);
  const simplifyPrecisionOption = TILE_URL_OPTIONS.simplifyPrecision || {};

  return Math.max(simplifyPrecisionOption[zoom] || defaultSimplifyPrecision, 0.0000001);
}

function tileParamsToBounds(tileParams) {
  const nwPoint = { x: tileParams.x, y: tileParams.y };
  const sePoint = { x: nwPoint.x + 1, y: nwPoint.y + 1 };

  const northWest = unproject(nwPoint, tileParams.z);
  const southEast = unproject(sePoint, tileParams.z);

  // northWest, southEast --> northEast, southWest
  const neLngLat = { lng: southEast.lng, lat: northWest.lat };
  const swLngLat = { lng: northWest.lng, lat: southEast.lat };

  return new mapboxgl.LngLatBounds(
    swLngLat,
    neLngLat
  );
}

function tilePolygonString(tileParams) {
  const tileLatLngBounds = tileParamsToBounds(tileParams);
  return 'POLYGON(( ' +
    `${tileLatLngBounds.getWest()} ${tileLatLngBounds.getSouth()} ,` +
    `${tileLatLngBounds.getWest()} ${tileLatLngBounds.getNorth()} ,` +
    `${tileLatLngBounds.getEast()} ${tileLatLngBounds.getNorth()} ,` +
    `${tileLatLngBounds.getEast()} ${tileLatLngBounds.getSouth()} ,` +
    `${tileLatLngBounds.getWest()} ${tileLatLngBounds.getSouth()} ))`;
}

/**
* Unprojects a Google XYZ tile coord to lng/lat coords.
*/
function unproject(point, zoom) {
  return {
    lng: xLng(point.x, zoom),
    lat: yLat(point.y, zoom)
  };
}

/**
* Transform tile-x coordinate (Google XYZ) to a longitude value.
* @param  {number} x  -
* @param  {number} zoom  -
* @return {number} -
*/
function xLng(x, zoom) {
  return x * 360 / Math.pow(2, zoom) - 180;
}

/**
* Transform tile-y coordinate (Google XYZ) to a latitude value.
* @param  {number} y  -
* @param  {number} zoom  -
* @return {number} -
*/
function yLat(y, zoom) {
  const y2 = 180 - y * 360 / Math.pow(2, zoom);
  return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}
