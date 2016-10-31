import { translate } from '../I18n';

export const INPUT_DEBOUNCE_MILLISECONDS = 700;

export const COLUMN_TYPES = [
  {
    type: 'blob',
    icon: 'icon-data'
  },
  {
    type: 'calendar_date',
    preferredVisualizationTypes: ['timelineChart'],
    icon: 'icon-date'
  },
  {
    type: 'checkbox',
    icon: 'icon-check'
  },
  {
    type: 'line',
    icon: 'icon-geo'
  },
  {
    type: 'multiline',
    icon: 'icon-geo'
  },
  {
    type: 'multipoint',
    icon: 'icon-geo'
  },
  {
    type: 'multipolygon',
    icon: 'icon-geo'
  },
  {
    type: 'money',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'pieChart'],
    icon: 'icon-number'
  },
  {
    type: 'number',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'histogram'],
    icon: 'icon-number'
  },
  {
    type: 'percent',
    preferredVisualizationTypes: ['barChart', 'columnChart'],
    icon: 'icon-number'
  },
  {
    type: 'point',
    preferredVisualizationTypes: ['featureMap', 'regionMap'],
    icon: 'icon-map'
  },
  {
    type: 'polygon',
    icon: 'icon-geo'
  },
  {
    type: 'text',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'pieChart'],
    icon: 'icon-text'
  }
];

export const VISUALIZATION_TYPES = [
  {
    type: 'barChart',
    title: translate('visualizations.bar_chart.title'),
    icon: 'icon-bar-chart-horz',
    preferredDimensionTypes: ['money', 'number', 'percent', 'text']
  },
  {
    type: 'columnChart',
    title: translate('visualizations.column_chart.title'),
    icon: 'icon-bar-chart',
    preferredDimensionTypes: ['money', 'number', 'percent', 'text']
  },
  {
    type: 'pieChart',
    title: translate('visualizations.pie_chart.title'),
    icon: 'icon-pie-chart',
    preferredDimensionTypes: ['text']
  },
  {
    type: 'histogram',
    icon: 'icon-distribution',
    title: translate('visualizations.histogram.title'),
    preferredDimensionTypes: ['number']
  },
  {
    type: 'regionMap',
    icon: 'icon-region',
    title: translate('visualizations.region_map.title'),
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'featureMap',
    icon: 'icon-map',
    title: translate('visualizations.feature_map.title'),
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'timelineChart',
    icon: 'icon-line-chart',
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

export const COLOR_PALETTES = [
  {
    title: translate('color_palettes.categorical'),
    value: 'categorical'
  },
  {
    title: translate('color_palettes.alternate1'),
    value: 'alternate1'
  },
  {
    title: translate('color_palettes.alternate2'),
    value: 'alternate2'
  },
  {
    title: translate('color_palettes.accent'),
    value: 'accent'
  },
  {
    title: translate('color_palettes.dark'),
    value: 'dark'
  }
];

export const COLORS = [
  '#f0f2ff', '#eff8fb', '#eff8fb', '#f7f7f7', '#fdeddd', '#f6eef7', '#feffc8', '#fdebe1', '#fdffac',
  '#bed7e8', '#b5e3e2', '#b5cce5', '#cccccc', '#fac07e', '#bfc8e3', '#a2deb2', '#f8b2b8', '#fad04b',
  '#71abd9', '#6ac5a3', '#8f92c9', '#969696', '#f98d27', '#6da7d2', '#4cb6c6', '#f45ca1', '#f98d27',
  '#3d7ec0', '#31a75a', '#894baa', '#636363', '#e25200', '#2a919a', '#387bbb', '#c3008c', '#ec3001',
  '#1e489f', '#067126', '#80007f', '#252525', '#a33200', '#0f6f59', '#2d2298', '#79007a', '#ba001e'
];

export const CHART_SORTING = [
  {
    title: translate('panes.axis_and_scale.fields.chart_sorting.large_to_small'),
    orderBy: { parameter: 'measure', sort: 'desc' },
    icon: 'icon-sort-desc',
    group: translate('panes.axis_and_scale.fields.chart_sorting.sort_by_value')
  },
  {
    title: translate('panes.axis_and_scale.fields.chart_sorting.small_to_large'),
    orderBy: { parameter: 'measure', sort: 'asc' },
    icon: 'icon-sort-asc',
    group: translate('panes.axis_and_scale.fields.chart_sorting.sort_by_value')
  },
  {
    title: translate('panes.axis_and_scale.fields.chart_sorting.ascending'),
    orderBy: { parameter: 'dimension', sort: 'asc' },
    icon: 'icon-sort-az',
    group: translate('panes.axis_and_scale.fields.chart_sorting.sort_by_label')
  },
  {
    title: translate('panes.axis_and_scale.fields.chart_sorting.descending'),
    orderBy: { parameter: 'dimension', sort: 'desc' },
    icon: 'icon-sort-za',
    group: translate('panes.axis_and_scale.fields.chart_sorting.sort_by_label')
  }
];

export const TIMELINE_PRECISION = [
  {
    title: translate('panes.axis_and_scale.fields.timeline_precision.automatic'),
    value: null
  },
  {
    title: translate('panes.axis_and_scale.fields.timeline_precision.year'),
    value: 'YEAR'
  },
  {
    title: translate('panes.axis_and_scale.fields.timeline_precision.month'),
    value: 'MONTH'
  },
  {
    title: translate('panes.axis_and_scale.fields.timeline_precision.day'),
    value: 'DAY'
  }
];

export const DEFAULT_LIMIT_FOR_SHOW_OTHER_CATEGORY = {
  barChart: 10,
  pieChart: 12
};
