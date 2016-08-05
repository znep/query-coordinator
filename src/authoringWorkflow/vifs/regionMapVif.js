import { translate, translateGroup } from '../../I18n';
import { BASE_LAYERS } from '../constants';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseLayerUrl: BASE_LAYERS[0].value,
    baseLayerOpacity: 0.8,
    computedColumnName: null,
    legend: {
      type: 'continuous',
      negativeColor: '#c6663d',
      zeroColor: '#ffffff',
      positiveColor: '#003747'
    },
    shapefile: {
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
      type: 'regionMap'
    }
  ],
  title: ''
};
