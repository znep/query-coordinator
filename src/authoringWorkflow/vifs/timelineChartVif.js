export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    localization: {
      'NO_VALUE': 'No value',
      'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total',
      'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered',
      'FLYOUT_SELECTED_NOTICE': 'This column is selected'
    }
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
      type: 'timelineChart',
      unit: {
        one: 'One',
        other: 'Other'
      }
    }
  ],
  title: ''
};
