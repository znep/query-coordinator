import _ from 'lodash';

import { DEFAULT_BASE_MAP_STYLE } from '../mapConstants';

// Layer styles for every map style.
// Key =>  map style url,
// Value => layer style constants.
const BASEMAP_SPECIFIC_LAYER_STYLES = Object.freeze({
  // Raster: Simple Blue
  'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png': Object.freeze({
    CLUSTER_COLOR: '#cc3030 ',
    CLUSTER_BORDER_COLOR: '#330000 ',
    CLUSTER_TEXT_COLOR: '#FFFFFF ',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#cc3030 ',
    STACK_TEXT_COLOR: '#000000 '
  }),
  // Raster: Simple Grey
  'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png': Object.freeze({
    CLUSTER_COLOR: '#196aa1 ',
    CLUSTER_BORDER_COLOR: '#FFFFFF ',
    CLUSTER_TEXT_COLOR: '#FFFFFF ',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#196aa1 ',
    STACK_TEXT_COLOR: '#000000 '
  }),
  // Raster: ESRI
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}': Object.freeze({
    CLUSTER_COLOR: '#b1017e ',
    CLUSTER_BORDER_COLOR: '#FFFFFF ',
    CLUSTER_TEXT_COLOR: '#FFFFFF ',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#b1017e ',
    STACK_TEXT_COLOR: '#000000 '
  }),
  'mapbox://styles/mapbox/basic-v9': {
    CLUSTER_COLOR: '#046c8f ',
    CLUSTER_BORDER_COLOR: '#003b4d ',
    CLUSTER_TEXT_COLOR: '#FFFFFF ',
    PREPEND_HEAT_LAYER_AFTER: 'admin_country',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#046c8f ',
    STACK_TEXT_COLOR: '#656565 '
  },
  'mapbox://styles/mapbox/streets-v9': {
    CLUSTER_COLOR: '#1114de ',
    CLUSTER_BORDER_COLOR: '#FFFFFF ',
    CLUSTER_TEXT_COLOR: '#FFFFFF ',
    PREPEND_HEAT_LAYER_AFTER: 'waterway-label',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#1114de ',
    STACK_TEXT_COLOR: '#000e60 '
  },
  'mapbox://styles/mapbox/bright-v9': {
    CLUSTER_COLOR: '#c2869b ',
    CLUSTER_BORDER_COLOR: '#741f3d ',
    CLUSTER_TEXT_COLOR: '#000',
    PREPEND_HEAT_LAYER_AFTER: 'rail_station_label',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#c2869b ',
    STACK_TEXT_COLOR: '#000e60 '
  },
  'mapbox://styles/mapbox/light-v9': {
    CLUSTER_COLOR: '#d3f7ff ',
    CLUSTER_BORDER_COLOR: '#5bd0ea ',
    CLUSTER_TEXT_COLOR: '#000000 ',
    PREPEND_HEAT_LAYER_AFTER: 'waterway-label',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#5bd0ea ',
    STACK_TEXT_COLOR: '#000e60 '
  },
  'mapbox://styles/mapbox/dark-v9': {
    CLUSTER_COLOR: '#fdc9d3 ',
    CLUSTER_BORDER_COLOR: '#ffffff ',
    CLUSTER_TEXT_COLOR: '#000000 ',
    PREPEND_HEAT_LAYER_AFTER: 'waterway-label',
    STACK_COLOR: '#d6d6d6 ',
    STACK_BORDER_COLOR: '#FFFFFF ',
    STACK_TEXT_COLOR: '#000e60 '
  },
  'mapbox://styles/mapbox/satellite-v9': {
    CLUSTER_COLOR: '#ffe777 ',
    CLUSTER_BORDER_COLOR: '#ffffff ',
    CLUSTER_TEXT_COLOR: '#000000 ',
    STACK_COLOR: '#FFFFFF ',
    STACK_BORDER_COLOR: '#747474 ',
    STACK_TEXT_COLOR: '#000e60 '
  }
});

const DEFAULT_LAYER_STYLES = {
  CLUSTER_BORDER_SIZE: 2,
  CLUSTER_BORDER_OPACITY: 0.8,
  STACK_BORDER_SIZE: 2,
  STACK_BORDER_OPACITY: 0.8,
  // Cluster size varies based on configured min max cluster size.
  // But stack size is always fixed.
  STACK_SIZE: 24
};

export function getBaseMapLayerStyles(vif) {
  const baseMapStyle = getBaseMapStyle(vif);
  const baseMapSpecificStyle = _.get(BASEMAP_SPECIFIC_LAYER_STYLES, baseMapStyle, BASEMAP_SPECIFIC_LAYER_STYLES.DEFAULT);

  return _.merge({}, DEFAULT_LAYER_STYLES, baseMapSpecificStyle);
}

export function getBaseMapStyle(vif) {
  return _.get(vif, 'configuration.baseMapStyle', DEFAULT_BASE_MAP_STYLE);
}
