export default {
  aggregations: {
    sum: 'Sum',
    count: 'Count'
  },

  base_layers: {
    simple_blue: 'Simple Blue',
    simple_grey: 'Simple Grey',
    esri: 'Esri'
  },

  color_scales: {
    simple_blue: 'Simple Blue',
    simple_grey: 'Simple Grey',
    yellow_blue_green: 'Yellow Blue Green',
    intrepid_turquoise: 'Intrepid Turquoise'
  },

  modal: {
    title: 'Create A Visualization',
    close: 'Close',
    insert: 'Insert'
  },

  panes: {
    data: {
      title: 'Data',
      uhoh: 'Uh oh!',
      loading_metadata: 'Loading metadata...',
      loading_metadata_error: 'There was a mishap loading your metadata.',
      fields: {
        dimension: {
          title: 'Dimension',
          placeholder: 'Select a dimension...'
        },
        measure: {
          title: 'Measure',
          no_value: '(Count of Rows)'
        },
        measure_aggregation: {
          title: 'Measure Aggregation',
          no_value: 'No Measure Aggregation'
        },
        visualization_type: {
          title: 'Visualization Type',
          placeholder: 'Select a visualization type...'
        },
        region: {
          title: 'Region',
          placeholder: 'Select a region...'
        }
      }
    },
    title_and_description: {
      title: 'Title & Description',
      fields: {
        title: {
          title: 'Title'
        },
        description: {
          title: 'Description'
        }
      }
    },
    colors_and_style: {
      title: 'Colors & Style',
      fields: {
        base_color: {
          title: 'Base Color'
        },
        point_color: {
          title: 'Point Color'
        },
        point_opacity: {
          title: 'Point Opacity'
        },
        color_scale: {
          title: 'Color Scale'
        },
        base_layer: {
          title: 'Map Type'
        },
        base_layer_opacity: {
          title: 'Map Layer Opacity'
        }
      }
    },
    axis_and_scale: {
      title: 'Axis & Scale',
      subheaders: {
        labels: 'Labels'
      },
      fields: {
        top: {
          title: 'Top'
        },
        bottom: {
          title: 'Bottom'
        },
        left: {
          title: 'Left'
        },
        right: {
          title: 'Right'
        },
        x_axis_scaling_mode: {
          title: 'Autofit Horizontally'
        }
      }
    },
    legends_and_flyouts: {
      title: 'Legends & Flyouts',
      subheaders: {
        units: 'Units',
        flyout_title: 'Flyout Title'
      },
      fields: {
        units_one: {
          title: 'One'
        },
        units_other: {
          title: 'Other'
        },
        flyout_title: {
          no_value: 'No Flyout Title'
        }
      }
    }
  },

  preview: {
    tabs: {
      visualization: 'Visualization'
    }
  },

  visualizations: {
    common: {
      units: {
        one: 'Record',
        other: 'Records'
      }
    },
    choroplethMap: {
      title: 'Choropleth Map',
      FLYOUT_SELECTED_NOTICE: 'The page is currently filtered by this value, click to clear it',
      FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
      FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
      NO_VALUE: '(No Value)',
      CLEAR_FILTER_LABEL: 'Clear filter'
    },
    columnChart: {
      title: 'Column Chart',
      NO_VALUE: 'No value',
      NO_LABEL: '(No Label)',
      FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
      FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
      FLYOUT_SELECTED_NOTICE: 'This column is selected',
      ERROR_COLUMN_CHART_GENERIC: 'Sorry! There was an error rendering this column chart.',
      ERROR_COLUMN_CHART_EXCEEDED_MAX_COLUMN_COUNT: 'For optimal performance and legibility column charts are limited to {0} columns. Use filters to render a more specific chart.',
      ERROR_COLUMN_CHART_EXCEEDED_MAX_COLUMN_COUNT_WITHOUT_PAN: 'For optimal performance and legibility column charts for which panning is disabled are limited to {0} columns. Enable panning or use filters to render a more specific chart.'
    },
    featureMap: {
      title: 'Feature Map',
      FLYOUT_FILTER_NOTICE: 'There are too many points at this location',
      FLYOUT_FILTER_OR_ZOOM_NOTICE: 'Zoom in to see details',
      FLYOUT_DENSE_DATA_NOTICE: 'Numerous',
      FLYOUT_CLICK_TO_INSPECT_NOTICE: 'Click to see details',
      FLYOUT_CLICK_TO_LOCATE_USER_TITLE: 'Click to show your position on the map',
      FLYOUT_CLICK_TO_LOCATE_USER_NOTICE: 'You may have to give your browser permission to share your current location',
      FLYOUT_LOCATING_USER_TITLE: 'Your position is being determined',
      FLYOUT_LOCATE_USER_ERROR_TITLE: 'There was an error determining your location',
      FLYOUT_LOCATE_USER_ERROR_NOTICE: 'Click to try again',
      FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE: 'Panning and zooming has been disabled',
      ROW_INSPECTOR_ROW_DATA_QUERY_FAILED: 'Detailed information about these points cannot be loaded at this time',
      USER_CURRENT_POSITION: 'Your current location (estimated)',
      latitude: 'Latitude',
      longitude: 'Longitude'
    },
    timelineChart: {
      title: 'Timeline Chart',
      NO_VALUE: 'No value',
      FLYOUT_UNFILTERED_AMOUNT_LABEL: 'Total',
      FLYOUT_FILTERED_AMOUNT_LABEL: 'Filtered',
      FLYOUT_SELECTED_NOTICE: 'This column is selected',
      ERROR_TIMELINE_CHART_GENERIC: 'An error was encountered when rendering this chart. Please try again in a few minutes.',
      ERROR_TIMELINE_CHART_EXCEEDED_MAX_POINT_WITHOUT_PAN: 'For optimal performance and legibility timeline charts for which panning is disabled are limited to {0} points. Enable panning or use filters to render a more specific chart.',
      ERROR_TIMELINE_CHART_EXCEEDED_MAX_POINT_COUNT: 'For optimal performance and legibility timeline charts are limited to {0} points. Use filters to render a more specific chart.'
    }
  }
};
