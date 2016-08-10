import { translate, translateGroup } from '../../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  description: '',
  configuration: {
    bucketType: 'linear',
    viewSourceDataLink: true
  },
  series: [
    {
      color: {
        primary: '#71abd9',
        secondary: '#71abd9',
        highlight: '#cccccc'
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
          aggregationFunction: 'count'
        },
        type: 'socrata.soql',
        filters: []
      },
      label: null,
      type: 'histogram'
    }
  ],
  title: ''
};
