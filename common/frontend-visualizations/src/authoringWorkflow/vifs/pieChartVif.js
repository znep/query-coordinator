import { translate, translateGroup } from '../../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    viewSourceDataLink: true,
    showValueLabels: true,
    showValueLabelsAsPercent: false,
    showOtherCategory: true
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
        orderBy: {
          parameter: 'measure',
          sort: 'desc'
        },
        type: 'socrata.soql',
        filters: [],
        limit: 12
      },
      label: null,
      type: 'pieChart'
    }
  ],
  title: ''
};
