export default {
  aggregations: {
    sum: 'Sum',
    count: 'Count',
    none: 'None'
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
          placeholder: 'Select a dimension...',
          groups: {
            recommended_columns: 'Recommended Columns',
            all_columns: 'All Columns'
          }
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
          placeholder: 'Select a visualization type...',
          groups: {
            recommended_visualizations: 'Recommended Visualizations',
            all_visualizations: 'All Visualizations'
          }
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
          title: 'One',
          placeholder: 'Record'
        },
        units_other: {
          title: 'Other',
          placeholder: 'Records'
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
    },
    center_and_zoom: 'Your current zoom level and centering will be preserved on insertion.',
    saving_center_and_zoom: 'Saving zoom level and centering...'
  },
  visualizations: {
    common: {
      currency_symbol: '$',
      decimal_separator: '.',
      error_generic: 'An error occurred when rendering this chart.',
      flyout_value_label: 'Value',
      group_separator: ',',
      latitude: 'Latitude',
      longitude: 'Longitude',
      map_user_current_position: 'Your current location (estimated)',
      map_click_to_locate_user_title: 'Click to show your position on the map',
      map_click_to_locate_user_notice: 'You may have to give your browser permission to share your current location',
      map_locating_user_title: 'Your position is being determined',
      map_locate_user_error_title: 'There was an error determining your location',
      map_locate_user_error_notice: 'Click to try again',
      map_pan_zoom_disabled_warning_title: 'Panning and zooming has been disabled',
      no_value: '(No value)',
      no_label: '(No label)',
      unit: {
        one: 'Record',
        other: 'Records'
      }
    },
    choropleth_map: {
      title: 'Choropleth Map',
      flyout_selected_notice: 'The page is currently filtered by this value, click to clear it',
      flyout_unfiltered_amount_label: 'Total',
      flyout_filtered_amount_label: 'Filtered',
      no_value: '(No Value)',
      clear_filter_label: 'Clear filter'
    },
    column_chart: {
      error_exceeded_max_column_count: 'For optimal performance and legibility column charts are limited to {0} columns. Use filters to render a more specific chart.',
      error_exceeded_max_column_count_without_pan: 'For optimal performance and legibility column charts are limited to {0} columns. Use filters to render a more specific chart.',
      title: 'Column Chart'
    },
    histogram: {
      //TODO We've disabled log scales in histogram until we can figure out how we're going to handle these invalid domains.
      error_domain_includes_zero: 'The chart dimension includes or crosses zero. This is not displayable on a logarithmic scale. Please use a linear scale or use filters to limit the data to a valid range.',
      error_exceeded_max_bucket_count: 'For optimal performance and legibility histograms are limited to {0} buckets. Use filters to render a more specific chart.',
      title: 'Histogram'
    },
    feature_map: {
      error_incompatible_column: 'Feature Maps do not currently support the specified column type.',
      flyout_click_to_inspect_notice: 'Click to see details',
      flyout_dense_data_notice: 'Numerous',
      flyout_filter_notice: 'There are too many points at this location',
      flyout_filter_or_zoom_notice: 'Zoom in to see details',
      row_inspector_row_data_query_failed: 'Detailed information about these points cannot be loaded at this time',
      title: 'Feature Map'
    },
    region_map: {
      flyout_selected_notice: 'The visualization is currently filtered by this value',
      title: 'Region Map'
    },
    row_inspector: {
      default_label_unit: 'Row',
      next: 'Next',
      paging: '{0} of {1}',
      previous: 'Previous',
      showing: 'Showing {0}'
    },
    table: {
      all_rows: 'Showing all rows',
      error_unable_to_render: 'We\'re having trouble displaying this table. Check to make sure the underlying dataset hasn\'t been deleted or unpublished.',
      many_rows: 'Showing {unitOther} {firstRowOrdinal}-{lastRowOrdinal} out of {datasetRowCount}',
      next: 'Next',
      no_column_description: 'No description provided',
      no_row_count: 'Row count unavailable.',
      no_rows: 'No {unitOther}',
      only_row: 'Showing {unitOne} {firstRowOrdinal} of {datasetRowCount}',
      previous: 'Previous'
    },
    timeline_chart: {
      error_exceeded_max_point_count: 'For optimal performance and legibility timeline charts are limited to {0} points. Use filters to render a more specific chart.',
      error_exceeded_max_point_count_without_pan: 'For optimal performance and legibility timeline charts are limited to {0} points. Use filters to render a more specific chart.',
      title: 'Timeline Chart'
    }
  }
};
