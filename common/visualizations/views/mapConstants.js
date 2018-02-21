import { VECTOR_BASE_MAP_STYLES } from '../../../common/authoring_workflow/constants';

export const COLOR_BY_BUCKETS_COUNT = 5;
export const CLUSTER_BUCKETS = Object.freeze({
  SMALL: 0,
  MEDIUM: 100,
  LARGE: 1000
});

export const DEFAULT_BASE_MAP_STYLE = VECTOR_BASE_MAP_STYLES.basic.value;

export const GEO_LOCATE_CONTROL_OPTIONS = Object.freeze({
  positionOptions: Object.freeze({
    enableHighAccuracy: true
  }),
  trackUserLocation: true
});

export const MAP_CONTROLS_POSITION = Object.freeze({
  NAVIGATION: 'bottom-left',
  GEO_LOCATE: 'bottom-left',
  GEO_CODER: 'top-left'
});

export const MAP_TYPES = Object.freeze({
  POINT_MAP: 'pointMap',
  LINE_MAP: 'lineMap',
  BOUNDARY_MAP: 'boundaryMap'
});

export const NO_COLOR = 'rgba(0, 0, 0, 0)';

export const POINT_AGGREGATIONS = Object.freeze({
  NONE: 'none',
  HEAT_MAP: 'heat_map',
  REGION_MAP: 'region_map'
});

// TODO tune the precisions, right now, we are getting too many points.
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
    16: 16,
    17: 17,
    18: 18
  })
});

export const VIF_CONSTANTS = Object.freeze({
  // Line Map Constants
  LINE_WEIGHT: Object.freeze({ MIN: 1, MAX: 10, DEFAULT: 2 }),
  LINE_MAP_MIN_LINE_WEIGHT: Object.freeze({ MIN: 1, MAX: 10, DEFAULT: 2 }),
  LINE_MAP_MAX_LINE_WEIGHT: Object.freeze({ MIN: 1, MAX: 10, DEFAULT: 2 }),
  // Point Map Constants
  CLUSTER_RADIUS: Object.freeze({ MIN: 20, MAX: 120, DEFAULT: 80 }),
  CLUSTER_SIZE: Object.freeze({ MIN: 24, MAX: 50, DEFAULT: 40 }),
  CLUSTERING_ZOOM: Object.freeze({ MIN: 1, MAX: 22, DEFAULT: 9 }),
  NUMBER_OF_DATA_CLASSES: Object.freeze({ MIN: 2, MAX: 7, DEFAULT: 5 }),
  POINT_MAP_POINT_SIZE: Object.freeze({ MIN: 4, MAX: 40, DEFAULT: 10 }),
  POINT_MAP_MIN_POINT_SIZE: Object.freeze({ MIN: 4, MAX: 40, DEFAULT: 10 }),
  POINT_MAP_MAX_POINT_SIZE: Object.freeze({ MIN: 4, MAX: 40, DEFAULT: 18 }),
  POINT_OPACITY: Object.freeze({ MIN: 0, MAX: 1, DEFAULT: 1 }),
  POINT_THRESHOLD: Object.freeze({ MIN: 100, MAX: 10000, DEFAULT: 4500 }),
  STACK_RADIUS: Object.freeze({ MIN: 1, MAX: 80, DEFAULT: 1 })
});
