import { translate } from '../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseLayerUrl: null,
    baseLayerOpacity: 0.8,
    computedColumnName: null,
    // defaultExtent: {
    //   southwest: [Infinity, Infinity],
    //   northeast: [Infinity, Infinity]
    // },
    defaultFeatureStrokeWidth: 1,
    highlightFeatureStrokeWidth: 4,
    legend: {
      type: 'continuous',
      negativeColor: '#c6663d',
      zeroColor: '#ffffff',
      positiveColor: '#003747'
    },
    localization: translate('visualizations.choroplethMap'),
    mapMaxZoom: 18,
    mapMinZoom: 1,
    mapZoomAnimation: false,
    maxJenksClassBreaks: 7,
    // savedExtent: {
    //   southwest: [Infinity, Infinity],
    //   northeast: [Infinity, Infinity]
    // },
    shapefile: {
      columns: {
        name: '__SOCRATA_HUMAN_READABLE_NAME__',
        unfiltered: '__SOCRATA_UNFILTERED_VALUE__',
        filtered: '__SOCRATA_FILTERED_VALUE__',
        selected: '__SOCRATA_FEATURE_SELECTED__'
      },
      geometryLabel: null,
      primaryKey: '_feature_id',
      uid: null
    }
  },
  description: '',
  series: [
    {
      color: {},
      dataSource: {
        datasetUid: null,
        dimension: {
          columnName: null,
          aggregationFunction: null
        },
        domain: '',
        measure: {
          columnName: null,
          aggregationFunction: 'count'
        },
        type: 'socrata.soql',
        filters: []
      },
      label: null,
      type: 'choroplethMap',
      unit: {
        one: translate('visualizations.common.units.one'),
        other: translate('visualizations.common.units.other')
      }
    }
  ],
  title: ''
};
