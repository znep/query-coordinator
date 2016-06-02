// A skeleton vif used if none is provided
module.exports = {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    localization: {
      'FLYOUT_FILTER_NOTICE': 'There are too many points at this location',
      'FLYOUT_FILTER_OR_ZOOM_NOTICE': 'Zoom in to see details',
      'FLYOUT_DENSE_DATA_NOTICE': 'Numerous',
      'FLYOUT_CLICK_TO_INSPECT_NOTICE': 'Click to see details',
      'FLYOUT_CLICK_TO_LOCATE_USER_TITLE': 'Click to show your position on the map',
      'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE': 'You may have to give your browser permission to share your current location',
      'FLYOUT_LOCATING_USER_TITLE': 'Your position is being determined',
      'FLYOUT_LOCATE_USER_ERROR_TITLE': 'There was an error determining your location',
      'FLYOUT_LOCATE_USER_ERROR_NOTICE': 'Click to try again',
      'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE': 'Panning and zooming has been disabled',
      'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED': 'Detailed information about these points cannot be loaded at this time',
      'USER_CURRENT_POSITION': 'Your current location (estimated)'
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
      type: null,
      unit: {
        one: 'One',
        other: 'Other'
      }
    }
  ],
  title: ''
};
