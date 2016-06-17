import _ from 'lodash';

export const translate = key => {
  return _.get(translations, key, `Translation missing for ${key}.`);
};

export const translations = {
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
      title: 'Title & Description'
    },
    colors_and_style: {
      title: 'Colors & Style'
    },
    axis_and_scale: {
      title: 'Axis & Scale'
    },
    legends_and_flyouts: {
      title: 'Legends & Flyouts',
      fields: {
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
    choroplethMap: {
      title: 'Choropleth Map'
    },
    columnChart: {
      title: 'Column Chart'
    },
    featureMap: {
      title: 'Feature Map'
    },
    timelineChart: {
      title: 'Timeline Chart'
    }
  }
};
