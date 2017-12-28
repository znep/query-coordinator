import { BASE_LAYERS } from '../constants';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseLayerOpacity: 0.8,
    baseLayerUrl: BASE_LAYERS[0].value,
    datasetMetadata: false,
    locateUser: false,
    panAndZoom: true,
    rowInspectorTitleColumnName: null,
    viewSourceDataLink: true
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
      type: 'map'
    }
  ],
  title: ''
};
