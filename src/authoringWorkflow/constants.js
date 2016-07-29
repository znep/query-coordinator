import { translate } from '../I18n';

export const INPUT_DEBOUNCE_MILLISECONDS = 300;

export const DIMENSION_TYPES = [
  {
    type: 'text',
    preferredVisualizationTypes: ['columnChart']
  },
  {
    type: 'point',
    preferredVisualizationTypes: ['featureMap', 'regionMap']
  },
  {
    type: 'money',
    preferredVisualizationTypes: ['columnChart']
  },
  {
    type: 'number',
    preferredVisualizationTypes: ['columnChart', 'histogram']
  },
  {
    type: 'calendar_date',
    preferredVisualizationTypes: ['timelineChart']
  }
];

export const VISUALIZATION_TYPES = [
  {
    type: 'columnChart',
    title: translate('visualizations.column_chart.title'),
    preferredDimensionTypes: ['text', 'number', 'money']
  },
  {
    type: 'histogram',
    title: translate('visualizations.histogram.title'),
    preferredDimensionTypes: ['number']
  },
  {
    type: 'regionMap',
    title: translate('visualizations.region_map.title'),
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'featureMap',
    title: translate('visualizations.feature_map.title'),
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'timelineChart',
    title: translate('visualizations.timeline_chart.title'),
    preferredDimensionTypes: ['calendar_date']
  }
];

export const AGGREGATION_TYPES = [
  {
    type: 'sum',
    title: translate('aggregations.sum')
  }
];

export const BASE_LAYERS = [
  {
    title: translate('base_layers.simple_blue'),
    value: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png'
  },
  {
    title: translate('base_layers.simple_grey'),
    value: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png'
  },
  {
    title: translate('base_layers.esri'),
    value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
  }
];

export const COLOR_SCALES = [
  {
    title: translate('color_scales.simple_blue'),
    value: 'simpleBlue',
    scale: ['#c6663d', '#ffffff', '#003747']
  },
  {
    title: translate('color_scales.simple_grey'),
    value: 'simpleGrey',
    scale: ['#c8c8c8', '#bdbdbd', '#2c2c2c']
  },
  {
    title: translate('color_scales.red_yellow'),
    value: 'RdOrYl',
    scale: ['#2482bc', '#fdffac', '#ba001e']
  },
  {
    title: translate('color_scales.green_white_purple'),
    value: 'GrWhPu',
    scale: ['#008932', '#f7f7f7', '#7c2d96']
  }
];

export const COLORS = [
  '#f0f2ff', '#eff8fb', '#eff8fb', '#f7f7f7', '#fdeddd', '#f6eef7', '#feffc8', '#fdebe1', '#fdffac',
  '#bed7e8', '#b5e3e2', '#b5cce5', '#cccccc', '#fac07e', '#bfc8e3', '#a2deb2', '#f8b2b8', '#fad04b',
  '#71abd9', '#6ac5a3', '#8f92c9', '#969696', '#f98d27', '#6da7d2', '#4cb6c6', '#f45ca1', '#f98d27',
  '#3d7ec0', '#31a75a', '#894baa', '#636363', '#e25200', '#2a919a', '#387bbb', '#c3008c', '#ec3001',
  '#1e489f', '#067126', '#80007f', '#252525', '#a33200', '#0f6f59', '#2d2298', '#79007a', '#ba001e'
];
