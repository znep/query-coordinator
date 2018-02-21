import _ from 'lodash';

import * as genericContentFormatter from './genericContentFormatter';
import * as mapConstants from 'common/visualizations/views/mapConstants';

// Sample Line Feature: (Geojson object got from mapbox-gl map)
// {
//  "type": "Feature",
//  "geometry": {
//    "type": "LineString",
//    "coordinates": [
//    [-122.44754076004028, 37.8044394394888],
//    [-122.44754076004029, 37.8044394394887],
//    ]
//  },
//  "properties": {
//    "__count_by__": 245690
//    "min_id": row-skje.is7r_6t96
//  },
//  "layer": { ... }
// }

// Builds html tipsy content for a point.
export async function setPopupContentForLine(popupParams = {}) {
  const { element, feature, renderOptions, vif } = popupParams;
  const rowId = _.get(feature.properties, renderOptions.idBy);

  if (!_.isUndefined(rowId)) {
    const retrieveDataCondition = `:id ="${rowId}"`;

    return await genericContentFormatter.setPopupContent(
      element,
      vif,
      renderOptions,
      retrieveDataCondition
    );
  }
}
