export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    viewSourceDataLink: false
  },
  description: '',
  series: [
    {
      color: {
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
      type: 'table',
      unit: {
        one: 'row',
        other: 'rows'
      }
    }
  ],
  title: ''
};
