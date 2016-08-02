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
    datasetMetadata: false,
    rowInspectorTitleColumnName: null,
    locateUser: false,
    panAndZoom: true
  },
  description: '',
  series: [
    {
      color: {
        primary: '#eb6900'
      },
      dataSource: {
        datasetUid: null,
        dimension: {
          columnName: null,
          aggregationFunction: null
        },
        domain: '',
        measure: {
          columnName: null,
          aggregationFunction: null
        },
        type: 'socrata.soql',
        filters: []
      },
      label: null,
      type: 'featureMap'
    }
  ],
  title: ''
};
