window.socrata = window.socrata || {};
socrata.sampleVifs = {
  choroplethVif: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'dataspace.demo.socrata.com',
          datasetUid: '52my-2pak'
        }
      }
    ]
  },

  ufoSightingsVifStaging: {
    configuration: {},
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'vertex-stories.test-socrata.com',
          datasetUid: 'k6cs-ww27'
        }
      }
    ]
  },

  featureMapVif: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'dataspace.demo.socrata.com',
          datasetUid: 'r6t9-rak2'
        },
        type: "featureMap"
      }
    ]
  },

  licenseeTaxStaging: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'vertex-stories.test-socrata.com',
          datasetUid: 'qnur-w9s6'
        }
      }
    ]
  },

  iowaMathAndReadingProficiencyStaging: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    configuration: {
      top: 'Top Axis Label',
      right: 'Right Axis Label',
      bottom: 'Bottom Axis Label',
      left: 'Left Axis Label'
    },
    series: [
      {
        color: {
          primary: 'pink',
          highlight: 'indigo'
        },
        dataSource: {
          datasetUid: 'vc2c-3mst',
          dimension: {
            columnName: 'grade',
            aggregationFunction: null
          },
          domain: 'vertex-stories.test-socrata.com',
          measure: {
            columnName: 'proficient_2',
            aggregationFunction: 'sum'
          }
        },
        type: 'columnChart',
        unit: {
          one: 'Custom Unit',
          other: 'Custom Units'
        }
      }
    ],
    title: 'My Great Column Chart',
    description: 'Iowa Math and Reading Proficiency'
  },

  v1FeatureMapVif: {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
    'columnName': 'point',
    'configuration': {
      'datasetMetadata': false,
      'hover': true,
      'panAndZoom': true,
      'locateUser': true,
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.8
    },
    'createdAt': '2014-01-01T00:00:00',
    'datasetUid': 'r6t9-rak2',
    'description': 'useless description should be deleted in migration',
    'domain': 'dataspace.demo.socrata.com',
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'origin': {
      'type': 'test_data',
      'url': 'localhost'
    },
    'title': 'useless title should be deleted in migration',
    'type': 'featureMap',
    'unit': {
      'one': 'record',
      'other': 'records'
    }
  },

  localhost: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'localhost',
          datasetUid: '2k23-drn3'
        }
      }
    ]
  },

  whiteHouseStaffStaging: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'vertex-stories.test-socrata.com',
          datasetUid: '6ta3-xmf3'
        }
      }
    ]
  },

  percentColumnNBEExample: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'ori-performance.demo.socrata.com',
          datasetUid: 'mkvz-3tmj'
        }
      }
    ]
  },

  columnChartV1Vif: {
    'aggregation': {
      'columnName': null,
      'function': 'count'
    },
    'columnName': 'category',
    'configuration': {},
    'createdAt': '2014-01-01T00:00:00',
    'datasetUid': 'r6t9-rak2',
    'domain': 'dataspace.demo.socrata.com',
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 1
    },
    'origin': {
      'type': 'test_data',
      'url': 'localhost'
    },
    'title': 'Column: `category`',
    'type': 'columnChart',
    'unit': {
      'one': 'case',
      'other': 'cases'
    }
  }
};
