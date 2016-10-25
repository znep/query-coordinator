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
    green_white_purple: 'Green White Purple',
    red_yellow: 'Red Yellow'
  },
  color_palettes: {
    categorical: 'Categorical',
    alternate1: 'Alternate 1',
    alternate2: 'Alternate 2',
    dark: 'Dark'
  },
  modal: {
    title: 'Create A Visualization',
    based_on: 'Based on ',
    close: 'Close',
    insert: 'Insert',
    changes_made_confirmation: 'You have made changes! Are you sure you want to cancel?'
  },
  panes: {
    nothing_here: 'There\'s nothing to configure in this pane yet!',
    data: {
      title: 'Data',
      uhoh: 'Uh oh!',
      loading_metadata: 'Loading metadata...',
      loading_metadata_error: 'There was a mishap loading your metadata.',
      fields: {
        dimension: {
          title: 'Dimension',
          description: 'A dimension is a field that orders, groups, or categorizes your data, such as dates and categories. The dimension is often shown on the x-axis or as points on a map.',
          placeholder: 'Select a dimension...',
          groups: {
            recommended_columns: 'Recommended Columns',
            all_columns: 'All Columns'
          }
        },
        measure: {
          title: 'Measure',
          description: 'A measure is a numeric field or the count of rows associated with the selected dimension.',
          no_value: '(Count of Rows)',
          empty_measure: 'Your dataset must contain a column with numeric values in order to use the measure aggregation function.'
        },
        measure_aggregation: {
          title: 'Measure Aggregation',
          no_value: 'No Measure Aggregation'
        },
        visualization_type: {
          placeholder: 'Select a visualization type...',
          groups: {
            recommended_visualizations: 'Recommended Visualizations',
            all_visualizations: 'All Visualizations'
          },
          recommended: 'Recommended',
          recommended_based_on: 'Recommended based on your dimension selection.',
          no_boundaries: 'Region maps will not work because there are no boundaries configured for your domain!',
          ask_site_admin: 'Ask your site administrator to configure the available set through the <a href="/admin/geo">Spatial Lens</a> section in the admin panel, or contact <a href="mailto:support@socrata.com">Socrata support</a>.'
        },
        region: {
          title: 'Region',
          placeholder: 'Select a region...',
          groups: {
            ready_to_use: 'Ready To Use',
            requires_processing: 'Requires Processing'
          },
          region_processing: 'Some regions require processing prior to rendering.',
          selected_region_processing: 'The selected region is currently being processed and geocoded.',
          region_coding_duration: 'Region coding duration depends on the size of your dataset and how many other requests are currently in process.',
          stay_or_return_later: 'You can keep this window open or return and pick the region later after processing is complete.',
          last_checked: 'Last checked:',
          never: 'Never'
        },
        bar_chart_limit: {
          title: 'Limit Displayed Bars',
          subtitle: 'Number of bars to display',
          none: 'Show all',
          count: 'Show'
        },
        pie_chart_limit: {
          title: 'Limit Displayed Slices',
          subtitle: 'Number of slices to display',
          none: 'Show all',
          count: 'Show'
        },
        show_other_category: {
          title: 'Group remaining as "Other"'
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
        },
        show_source_data_link: {
          title: 'Show "View Source Data" link'
        }
      }
    },
    colors_and_style: {
      title: 'Colors & Style',
      subheaders: {
        points: 'Points',
        map: 'Map'
      },
      fields: {
        bar_color: {
          title: 'Bar Color'
        },
        line_color: {
          title: 'Line Color'
        },
        area_color: {
          title: 'Area Color'
        },
        point_color: {
          title: 'Color'
        },
        point_opacity: {
          title: 'Opacity'
        },
        point_size: {
          title: 'Size'
        },
        color_scale: {
          title: 'Color Scale'
        },
        color_palette: {
          title: 'Color Palette'
        },
        base_layer: {
          title: 'Type'
        },
        base_layer_opacity: {
          title: 'Opacity'
        }
      }
    },
    axis_and_scale: {
      title: 'Axis & Scale',
      subheaders: {
        axis_titles: 'Axis Titles',
        axis_labels: 'Axis labels',
        data_labels: 'Data Labels',
        chart_sorting: 'Chart Sorting',
        grouping_and_display: 'Grouping and Display'
      },
      fields: {
        top_axis_title: {
          title: 'Top Axis Title'
        },
        bottom_axis_title: {
          title: 'Bottom Axis Title'
        },
        left_axis_title: {
          title: 'Left Axis Title'
        },
        right_axis_title: {
          title: 'Right Axis Title'
        },
        x_axis_scaling_mode: {
          title: 'Auto-fit X-Axis'
        },
        show_dimension_labels: {
          title: 'Show Dimension Labels'
        },
        show_value_labels: {
          title: 'Show Value Labels'
        },
        show_value_labels_as_percent: {
          title: 'Label chart slices as %'
        },
        chart_sorting: {
          large_to_small: 'Largest to smallest by value',
          small_to_large: 'Smallest to largest by value',
          ascending: 'Ascending by label',
          descending: 'Descending by label',
          sort_by_value: 'Value',
          sort_by_label: 'Label'
        },
        timeline_precision: {
          automatic: 'Automatic',
          year: 'Group by Year',
          month: 'Group by Month',
          day: 'Group by Day',
          title: 'Grouping'
        },
        treat_null_values_as_zero: {
          title: 'Display Missing or Null Values as Zero'
        }
      }
    },
    legends_and_flyouts: {
      title: 'Legends & Flyouts',
      subheaders: {
        units: {
          title: 'Flyout Unit Label',
          description: 'Unit label displayed in flyouts describing chart values.'
        },
        row_inspector_title: 'Point Inspector Title'
      },
      fields: {
        units_one: {
          title: 'Singular',
          placeholder: 'Record'
        },
        units_other: {
          title: 'Plural',
          placeholder: 'Records'
        },
        row_inspector_title: {
          no_value: 'No Point Inspector Title'
        }
      }
    }
  },
  preview: {
    tabs: {
      visualization: 'Visualization'
    },
    get_started: {
      title: 'Select data or a chart type to get started',
      description: 'There are two ways to get started. Select a chart type to see recommended dimensions and measures or select a dimension or measure to see recommended chart types.'
    },
    center_and_zoom: 'Your current zoom level and centering will be preserved on insertion.',
    saving_center_and_zoom: 'Saving zoom level and centering...'
  },
  table_view: {
    title: 'Table Preview'
  },
  common: {
    reset_confirm: 'Are you sure you want to reset? All changes made during this editing session will be lost.',
    reset_button_label: 'Reset'
  },
  visualizations: {
    bar_chart: {
      error_exceeded_max_bar_count: 'For optimal performance and legibility bar charts are limited to {0} bars. Use filters to render a more specific chart.',
      error_exceeded_max_bar_count_without_pan: 'For optimal performance and legibility bar charts are limited to {0} bars. Use filters to render a more specific chart.',
      title: 'Bar Chart'
    },
    common: {
      view_source_data: 'View Source Data',
      panning_notice: 'Click and drag to pan the chart',
      currency_symbol: '$',
      percent_symbol: '%',
      decimal_separator: '.',
      error_generic: 'An error occurred when rendering this chart.',
      error_no_data: 'There is no data to display.',
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
      other_category: '(Other)',
      unit: {
        one: 'Record',
        other: 'Records'
      },
      validation: {
        errors: {
          dimension_column_should_be_calendar_date:  'This visualization requires its dimension column to be set to a date column. Try setting the dimension to a date column.',
          dimension_column_should_be_numeric: 'This visualization requires its dimension column to be set to a numeric column. Try setting the dimension to a numeric column.',
          dimension_column_should_be_point: 'This visualization requires its dimension column to be set to a location column. Try setting the dimension to a location column.',
          generic: 'An error was encountered when rendering this visualization. Try again in a few minutes.',
          multiple_errors: 'This visualization encountered multiple errors:',
          need_aggregation: 'This visualization requires an aggregation to be selected. Try selecting an aggregation or choosing "Count of Rows" from the measure selection.',
          need_no_aggregation: 'This visualization must not have an aggregation on its measure. Try selecting "none" as the aggregation.',
          need_at_least_one_series: 'This visualization requires at least one series.',
          need_all_series_from_same_domain: 'This visualization requires all series to be from the same domain.',
          need_single_series: 'This visualization requires a single series.'
        }
      },
      error_other_category_query_failed: 'An error was encountered when preparing the "Other" grouping. This data configuration may not support the \'Group remaining as "Other"\' option.',
      error_duplicated_dimension_value: 'The data settings for this chart have resulted in duplicate values. Try selecting a dimension with unique values or apply an aggregation function to the measure.'
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
    pie_chart: {
      title: 'Pie Chart',
      error_limit_out_of_bounds: 'This visualization requires dataSource.limit should be between {0} and {1}.'
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
      title: 'Point Map'
    },
    region_map: {
      flyout_selected_notice: 'The visualization is currently filtered by this value',
      title: 'Region Map',
      error_logarithm_unavailable: 'Because the configured data includes a zero and/or negative value, a logarithmic scale cannot be defined.'
    },
    row_inspector: {
      default_label_unit: 'Row',
      next: 'Next',
      paging: '{0} of {1}',
      previous: 'Previous',
      showing: 'Showing {0}'
    },
    sample_chart: {
      error_exceeded_max_item_count: 'This chart only supports two items. Use filters to render a more specific chart.'
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
      error_two_or_more_rows_required: 'Two or more rows are required to render a timeline chart. Omit filters to render more rows or choose a different dataset.',
      title: 'Timeline Chart'
    }
  }
};
