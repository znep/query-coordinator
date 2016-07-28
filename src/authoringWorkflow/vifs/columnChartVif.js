import { translate, translateGroup } from '../../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    xAxisScalingMode: 'pan'
  },
  description: '',
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
      type: 'columnChart'
    }
  ],
  title: ''
};
