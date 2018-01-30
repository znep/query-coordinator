import _ from 'lodash';

import * as genericContentFormatter from './genericContentFormatter';
import * as mapConstants from 'common/visualizations/views/mapConstants';

// Sample Point Feature: (Geojson object got from mapbox-gl map)
//    {
//      "type": "Feature",
//      "geometry": {
//        "type": "Point",
//        "coordinates": [-122.44754076004028,37.8044394394888]
//      },
//      "properties": {
//        "cluster": false
//        "__aggregate_by__": 97491
//      },
//      "layer": { ... }
//    }

// Builds html tipsy content for a point.
export async function setPopupContentForPoint(
    {
      element: element,
      vif: vif,
      renderOptions: renderOptions,
      feature: feature, // Geojson Feature object with geometry(snapped_for_zoom)
      featureRenderedOnZoom: zoom
    } = {}
) {
  const lng = _.get(feature, 'geometry.coordinates[0]');
  const lat = _.get(feature, 'geometry.coordinates[1]');
  const snapZoom = _.get(mapConstants, `TILE_URL_OPTIONS.snapZoom[${zoom}]`, zoom);
  const retrieveDataCondition = 'intersects(' +
    `snap_for_zoom(${vif.getColumnName()},${snapZoom}),` +
    `snap_for_zoom('POINT (${lng} ${lat})',${snapZoom})` +
    ')';

  return await genericContentFormatter.setPopupContent(
    element,
    vif,
    renderOptions,
    retrieveDataCondition
  );
}

