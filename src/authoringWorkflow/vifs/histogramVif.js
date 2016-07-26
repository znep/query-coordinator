import { translate, translateGroup } from '../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  description: '',
  series: [
    {
      color: {
        primary: '#00a1af',
        secondary: '#00a1af'
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
