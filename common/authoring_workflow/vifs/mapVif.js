import { VECTOR_BASE_MAP_STYLES } from '../constants';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseMapStyle: VECTOR_BASE_MAP_STYLES.basic.value,
    datasetMetadata: false,
    geoCoderControl: true,
    geoLocateControl: true,
    locateUser: false,
    navigationControl: true,
    panAndZoom: true,
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
