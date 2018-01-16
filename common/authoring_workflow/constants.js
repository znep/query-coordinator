import I18n from 'common/i18n';

export const INPUT_DEBOUNCE_MILLISECONDS = 700;
export const MAP_SLIDER_DEBOUNCE_MILLISECONDS = 1000;
export const MAXIMUM_MEASURES = 12;
export const MAXIMUM_COMBO_CHART_MEASURES = 6;
export const NUMERIC_COLUMN_TYPES = ['number', 'money', 'percent'];
export const GEO_LOCATION_COLUMN_TYPES = ['location', 'point', 'multipoint', 'line', 'multiline', 'polygon', 'multipolygon'];

export const COLUMN_TYPES = [
  {
    type: 'blob',
    icon: 'icon-data'
  },
  {
    type: 'calendar_date',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'timelineChart', 'comboChart'],
    icon: 'icon-date'
  },
  {
    type: 'checkbox',
    icon: 'icon-check'
  },
  {
    type: 'line',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'multiline',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'multipoint',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'multipolygon',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'money',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'pieChart', 'histogram', 'comboChart'],
    icon: 'icon-dollar'
  },
  {
    type: 'number',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'histogram', 'comboChart'],
    icon: 'icon-number'
  },
  {
    type: 'percent',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'comboChart'],
    icon: 'icon-number'
  },
  {
    type: 'point',
    preferredVisualizationTypes: ['featureMap', 'regionMap', 'map'],
    icon: 'icon-map'
  },
  {
    type: 'location',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'polygon',
    preferredVisualizationTypes: ['map'],
    icon: 'icon-geo'
  },
  {
    type: 'text',
    preferredVisualizationTypes: ['barChart', 'columnChart', 'pieChart', 'comboChart'],
    icon: 'icon-text'
  }
];

export const VISUALIZATION_TYPES = [
  {
    type: 'barChart',
    title: I18n.t('shared.visualizations.charts.bar_chart.title'),
    icon: 'icon-bar-chart-horz',
    preferredDimensionTypes: ['calendar_date', 'money', 'number', 'percent', 'text']
  },
  {
    type: 'columnChart',
    title: I18n.t('shared.visualizations.charts.column_chart.title'),
    icon: 'icon-bar-chart',
    preferredDimensionTypes: ['calendar_date', 'money', 'number', 'percent', 'text']
  },
  {
    type: 'pieChart',
    title: I18n.t('shared.visualizations.charts.pie_chart.title'),
    icon: 'icon-pie-chart',
    preferredDimensionTypes: ['text']
  },
  {
    type: 'histogram',
    title: I18n.t('shared.visualizations.charts.histogram.title'),
    icon: 'icon-distribution',
    preferredDimensionTypes: ['money', 'number']
  },
  {
    type: 'comboChart',
    title: I18n.t('shared.visualizations.charts.combo_chart.title'),
    icon: 'icon-combo-chart',
    preferredDimensionTypes: ['calendar_date']
  },
  {
    type: 'regionMap',
    title: I18n.t('shared.visualizations.charts.region_map.title'),
    icon: 'icon-region',
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'featureMap',
    title: I18n.t('shared.visualizations.charts.feature_map.title'),
    icon: 'icon-map',
    preferredDimensionTypes: ['point', 'location']
  },
  {
    type: 'map',
    title: I18n.t('shared.visualizations.charts.map.title'),
    icon: 'icon-geo',
    preferredDimensionTypes: GEO_LOCATION_COLUMN_TYPES
  },
  {
    type: 'timelineChart',
    title: I18n.t('shared.visualizations.charts.timeline_chart.title'),
    icon: 'icon-line-chart',
    preferredDimensionTypes: ['calendar_date']
  }
];

export const AGGREGATION_TYPES = [
  {
    type: 'sum',
    title: I18n.t('shared.visualizations.aggregations.sum')
  },
  {
    type: 'avg',
    title: I18n.t('shared.visualizations.aggregations.avg')
  },
  {
    type: 'median',
    title: I18n.t('shared.visualizations.aggregations.median')
  },
  {
    type: 'max',
    title: I18n.t('shared.visualizations.aggregations.max')
  },
  {
    type: 'min',
    title: I18n.t('shared.visualizations.aggregations.min')
  }
];

export const BASE_LAYERS = [
  {
    title: I18n.t('shared.visualizations.base_layers.simple_blue'),
    value: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png'
  },
  {
    title: I18n.t('shared.visualizations.base_layers.simple_grey'),
    value: 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png'
  },
  {
    title: I18n.t('shared.visualizations.base_layers.esri'),
    value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
  }
];

export const VECTOR_BASE_MAP_STYLES = {
  basic: {
    title: I18n.t('shared.visualizations.base_map_styles.basic'),
    value: 'mapbox://styles/mapbox/basic-v9'
  },
  streets: {
    title: I18n.t('shared.visualizations.base_map_styles.streets'),
    value: 'mapbox://styles/mapbox/streets-v9'
  },
  bright: {
    title: I18n.t('shared.visualizations.base_map_styles.bright'),
    value: 'mapbox://styles/mapbox/bright-v9'
  },
  light: {
    title: I18n.t('shared.visualizations.base_map_styles.light'),
    value: 'mapbox://styles/mapbox/light-v9'
  },
  dark: {
    title: I18n.t('shared.visualizations.base_map_styles.dark'),
    value: 'mapbox://styles/mapbox/dark-v9'
  },
  satellite: {
    title: I18n.t('shared.visualizations.base_map_styles.satellite'),
    value: 'mapbox://styles/mapbox/satellite-v9'
  }
};

export const BASE_MAP_STYLES = BASE_LAYERS.concat([
  VECTOR_BASE_MAP_STYLES.basic,
  VECTOR_BASE_MAP_STYLES.streets,
  VECTOR_BASE_MAP_STYLES.bright,
  VECTOR_BASE_MAP_STYLES.light,
  VECTOR_BASE_MAP_STYLES.dark,
  VECTOR_BASE_MAP_STYLES.satellite
]);

export const COLOR_SCALES = [
  {
    title: I18n.t('shared.visualizations.color_scales.simple_blue'),
    value: 'simpleBlue',
    scale: ['#c6663d', '#ffffff', '#003747']
  },
  {
    title: I18n.t('shared.visualizations.color_scales.simple_grey'),
    value: 'simpleGrey',
    scale: ['#c8c8c8', '#bdbdbd', '#2c2c2c']
  },
  {
    title: I18n.t('shared.visualizations.color_scales.red_yellow'),
    value: 'RdOrYl',
    scale: ['#2482bc', '#fdffac', '#ba001e']
  },
  {
    title: I18n.t('shared.visualizations.color_scales.green_white_purple'),
    value: 'GrWhPu',
    scale: ['#008932', '#f7f7f7', '#7c2d96']
  }
];

export const COLOR_PALETTES = [
  {
    title: I18n.t('shared.visualizations.color_palettes.categorical'),
    value: 'categorical'
  },
  {
    title: I18n.t('shared.visualizations.color_palettes.categorical2'),
    value: 'categorical2'
  },
  {
    title: I18n.t('shared.visualizations.color_palettes.alternate1'),
    value: 'alternate1'
  },
  {
    title: I18n.t('shared.visualizations.color_palettes.alternate2'),
    value: 'alternate2'
  },
  {
    title: I18n.t('shared.visualizations.color_palettes.accent'),
    value: 'accent'
  },
  {
    title: I18n.t('shared.visualizations.color_palettes.dark'),
    value: 'dark'
  }
];

export const COLOR_PALETTE_VALUES = {
  categorical: ['#a6cee3', '#5b9ec9', '#2d82af', '#7eba98', '#98d277', '#52af43', '#6f9e4c', '#dc9a88', '#f16666', '#e42022', '#f06c45', '#fdbb69', '#fe982c', '#f78620', '#d9a295', '#b294c7', '#7d54a6', '#9e8099', '#f0eb99', '#dbb466'],
  categorical2: ['#5b9ec9', '#98d277', '#f16666', '#fdbb69', '#b294c7', '#f0eb99', '#2d82af', '#52af43', '#dc9a88', '#fe982c', '#7d54a6', '#dbb466', '#a6cee3', '#6f9e4c', '#f06c45', '#9e8099', '#7eba98', '#e42022', '#d9a295', '#f78620'],
  alternate1: ['#e41a1c', '#9e425a', '#596a98', '#3b87a2', '#449b75', '#4daf4a', '#6b886d', '#896191', '#ac5782', '#d56b41', '#ff7f00', '#ffb214', '#ffe528', '#eddd30', '#c9992c', '#a65628', '#c66764', '#e678a0', '#e485b7', '#be8fa8'],
  alternate2: ['#66c2a5', '#9aaf8d', '#cf9c76', '#f68d67', '#cf948c', '#a89bb0', '#969dca', '#b596c7', '#d58ec4', '#dd95b2', '#c6b18b', '#afcc64', '#b7d84c', '#d6d83f', '#f6d832', '#f8d348', '#efcc6b', '#e6c58e', '#d5be9d', '#c4b8a8'],
  accent: ['#7fc97f', '#96bf9e', '#adb5bd', '#c4afcb', '#dbb6af', '#f3bd92', '#fdcd8a', '#fee491', '#fefb98', '#c0d0a0', '#769aa8', '#4166ad', '#853f9b', '#c91889', '#e8106e', '#d63048', '#c45121', '#a75d2b', '#866148', '#666666'],
  dark: ['#1b9e77', '#5d874e', '#a07125', '#d45f0a', '#b16548', '#8e6b86', '#8068ae', '#a850a0', '#d03792', '#d33b79', '#a66753', '#79932e', '#7fa718', '#aca80e', '#d9aa04', '#d69d08', '#bf8b12', '#a9781b', '#927132', '#7c6b4c']
};

export const COLORS = [
  '#f0f2ff', '#eff8fb', '#eff8fb', '#f7f7f7', '#fdeddd', '#f6eef7', '#feffc8', '#fdebe1', '#fdffac',
  '#bed7e8', '#b5e3e2', '#b5cce5', '#cccccc', '#fac07e', '#bfc8e3', '#a2deb2', '#f8b2b8', '#fad04b',
  '#71abd9', '#6ac5a3', '#8f92c9', '#969696', '#f98d27', '#6da7d2', '#4cb6c6', '#f45ca1', '#f98d27',
  '#3d7ec0', '#31a75a', '#894baa', '#636363', '#e25200', '#2a919a', '#387bbb', '#c3008c', '#ec3001',
  '#1e489f', '#067126', '#80007f', '#252525', '#a33200', '#0f6f59', '#2d2298', '#79007a', '#ba001e'
];

export const CHART_SORTING = [
  {
    title: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.large_to_small'),
    orderBy: { parameter: 'measure', sort: 'desc' },
    icon: 'icon-sort-desc',
    group: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.sort_by_value')
  },
  {
    title: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.small_to_large'),
    orderBy: { parameter: 'measure', sort: 'asc' },
    icon: 'icon-sort-asc',
    group: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.sort_by_value')
  },
  {
    title: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.ascending'),
    orderBy: { parameter: 'dimension', sort: 'asc' },
    icon: 'icon-sort-az',
    group: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.sort_by_label')
  },
  {
    title: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.descending'),
    orderBy: { parameter: 'dimension', sort: 'desc' },
    icon: 'icon-sort-za',
    group: I18n.t('shared.visualizations.panes.axis_and_scale.fields.chart_sorting.sort_by_label')
  }
];

export const TIMELINE_PRECISION = [
  {
    title: I18n.t('shared.visualizations.panes.data.fields.timeline_precision.automatic'),
    value: null
  },
  {
    title: I18n.t('shared.visualizations.panes.data.fields.timeline_precision.year'),
    value: 'year'
  },
  {
    title: I18n.t('shared.visualizations.panes.data.fields.timeline_precision.month'),
    value: 'month'
  },
  {
    title: I18n.t('shared.visualizations.panes.data.fields.timeline_precision.day'),
    value: 'day'
  },
  {
    title: I18n.t('shared.visualizations.panes.data.fields.timeline_precision.none'),
    value: 'none'
  }
];

export const DEFAULT_PRIMARY_COLOR = '#71abd9';
export const DEFAULT_SECONDARY_COLOR = '#71abd9';

export const DEFAULT_LIMIT_FOR_SHOW_OTHER_CATEGORY = {
  barChart: 10,
  pieChart: 12
};

export const ERROR_BARS_DEFAULT_BAR_COLOR = '#767676';
export const REFERENCE_LINES_DEFAULT_LINE_COLOR = '#767676';

export const SERIES_TYPE_COMBO_CHART = 'comboChart';
export const SERIES_TYPE_COMBO_CHART_COLUMN = 'comboChart.column';
export const SERIES_TYPE_COMBO_CHART_LINE = 'comboChart.line';
export const SERIES_TYPE_FLYOUT = 'flyout';
export const SERIES_TYPE_PIE_CHART = 'pieChart';

// Series variants really only apply to comboChart at present.  For example,
// a comboChart series type can be "comboChart.column" or "comboChart.line".
// The series variant is the "column" or "line" part.  The variant tells the
// visualization to render a series of columns or lines.
export const SERIES_VARIANT_COLUMN = 'column';
export const SERIES_VARIANT_LINE = 'line';
