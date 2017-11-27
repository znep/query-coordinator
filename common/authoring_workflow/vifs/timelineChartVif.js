export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    viewSourceDataLink: true,
    xAxisScalingMode: 'pan'
  },
  description: '',
  series: [
    {
      color: {
        primary: '#71abd9',
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
        filters: [],
        precision: null
      },
      label: null,
      type: 'timelineChart'
    }
  ],
  title: ''
};
