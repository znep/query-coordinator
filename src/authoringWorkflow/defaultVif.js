// A skeleton vif used if none is provided
module.exports = {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {

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
          aggregationFunction: null
        },
        type: 'socrata.soql',
        filters: []
      },
      label: null,
      type: null
    }
  ],
  title: ''
};
