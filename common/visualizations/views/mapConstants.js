import { VECTOR_BASE_MAP_STYLES } from '../../../common/authoring_workflow/constants';

export const MAP_TYPES = Object.freeze({
  POINT_MAP: 'pointMap',
  LINE_MAP: 'lineMap',
  BOUNDARY_MAP: 'boundaryMap'
});

export const DEFAULT_BASE_MAP_STYLE = VECTOR_BASE_MAP_STYLES.basic.value;

export const POINT_AGGREATIONS = Object.freeze({
  NONE: 'none',
  HEAT_MAP: 'heat_map'
});

export const GEO_LOCATE_CONTROL_OPTIONS = Object.freeze({
  positionOptions: Object.freeze({
    enableHighAccuracy: true
  }),
  trackUserLocation: true
});

export const MAP_CONTROLS_POSITION = Object.freeze({
  NAVIGATION: 'top-left',
  GEO_LOCATE: 'bottom-left',
  GEO_CODER: 'top-right'
});

export const TILE_URL_OPTIONS = Object.freeze({
  snapPrecision: Object.freeze({
    1: 0.001,
    2: 0.001,
    3: 0.001,
    4: 0.001,
    5: 0.001,
    6: 0.001,
    7: 0.001,
    8: 0.001,
    9: 0.001,
    10: 0.0006,
    11: 0.0006,
    12: 0.0001,
    13: 0.0001,
    14: 0.000002,
    15: 0.0000001,
    16: 0.000003125
  }),
  simplifyPrecision: Object.freeze({
    1: 0.001,
    2: 0.001,
    3: 0.001,
    4: 0.001,
    5: 0.001,
    6: 0.001,
    7: 0.001,
    8: 0.001,
    9: 0.001,
    10: 0.0006,
    11: 0.0006,
    12: 0.0001,
    13: 0.0001,
    14: 0.000002,
    15: 0.0000001,
    16: 0.000003125
  }),
  snapZoom: Object.freeze({
    1: 3,
    2: 3,
    3: 3,
    4: 6,
    5: 6,
    6: 6,
    7: 9,
    8: 9,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
    13: 13,
    14: 14,
    15: 15,
    16: 16
  })
});
