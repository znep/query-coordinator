import { translate } from './I18n';

export const INPUT_DEBOUNCE_MILLISECONDS = 300;

export const VISUALIZATION_TYPES = [
  {
    type: 'columnChart',
    title: translate('visualizations.column_chart.title')
  },
  {
    type: 'choroplethMap',
    title: translate('visualizations.choropleth_map.title')
  },
  {
    type: 'featureMap',
    title: translate('visualizations.feature_map.title')
  },
  {
    type: 'timelineChart',
    title: translate('visualizations.timeline_chart.title')
  }
];

export const AGGREGATION_TYPES = [
  {
    type: 'count',
    title: translate('aggregations.count')
  },
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
    title: translate('color_scales.yellow_blue_green'),
    value: 'YlGnBu',
    scale: ['#edf8b1', '#7fcdbb', '#2c7fb8']
  },
  {
    title: translate('color_scales.intrepid_turquoise'),
    value: 'intrepidTurquoise',
    scale: ['#ff5100', '#ffffff', '#19ffe8']
  }
];