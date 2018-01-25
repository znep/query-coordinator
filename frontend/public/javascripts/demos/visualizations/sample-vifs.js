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
        type: 'featureMap'
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

  whiteHouseStaffStaging: {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: 'vertex-stories.test-socrata.com',
          datasetUid: 'fne3-4ids'
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

socrata.sampleVifsByChartType = {
  barChart: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'showDimensionLabels': true,
      'showValueLabels': true,
      'xAxisScalingMode': 'pan',
      'showOtherCategory': true
    },
    'description': '',
    'series': [{
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'blood_alcohol_level',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'orderBy': {
          'parameter': 'measure',
          'sort': 'desc'
        },
        'type': 'socrata.soql',
        'filters': [],
        'limit': 10
      },
      'label': null,
      'type': 'barChart',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Bar Chart Example'
  },

  columnChart: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'showDimensionLabels': true,
      'xAxisScalingMode': 'pan'
    },
    'description': '',
    'series': [{
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'id',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'orderBy': {
          'parameter': 'measure',
          'sort': 'desc'
        },
        'type': 'socrata.soql',
        'filters': []
      },
      'label': null,
      'type': 'columnChart',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Column Chart Example'
  },

  comboChart:
  {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'showDimensionLabels': true,
      'xAxisScalingMode': 'pan',
      'axisLabels': {}
    },
    'description': '',
    'series': [
      {
        'color': {
          'primary': '#5b9ec9',
          'secondary': '#5b9ec9',
          'highlight': '#cccccc',
          'palette': 'categorical'
        },
        'dataSource': {
          'datasetUid': 'r6t9-rak2',
          'dimension': {
            'columnName': 'category',
            'aggregationFunction': null
          },
          'domain': 'dataspace.demo.socrata.com',
          'measure': {
            'columnName': null,
            'aggregationFunction': 'count'
          },
          'orderBy': {
            'parameter': 'measure',
            'sort': 'desc'
          },
          'type': 'socrata.soql',
          'filters': []
        },
        'label': null,
        'type': 'comboChart.column',
        'unit': {
          'one': 'case',
          'other': 'cases'
        }
      },
      {
        'color': {
          'primary': '#2d82af',
          'secondary': '#2d82af',
          'highlight': '#cccccc',
          'palette': 'categorical'
        },
        'dataSource': {
          'datasetUid': 'r6t9-rak2',
          'dimension': {
            'columnName': 'category',
            'aggregationFunction': null
          },
          'domain': 'dataspace.demo.socrata.com',
          'measure': {
            'columnName': null,
            'aggregationFunction': 'count'
          },
          'orderBy': {
            'parameter': 'measure',
            'sort': 'desc'
          },
          'type': 'socrata.soql',
          'filters': []
        },
        'label': null,
        'type': 'comboChart.line',
        'unit': {
          'one': 'case',
          'other': 'cases'
        }
      }
    ],
    'title': 'Combo Chart Example'
  },

  featureMap: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'datasetMetadata': false,
      'interactive': true,
      'panAndZoom': true,
      'locateUser': true,
      'pointOpacity': '0.24',
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.8
    },
    'series': [
      {
        'color': {
          'primary': '#0088ff'
        },
        'dataSource': {
          'datasetUid': 'r6t9-rak2',
          'dimension': {
            'columnName': 'point',
            'aggregationFunction': null
          },
          'domain': 'dataspace.demo.socrata.com',
          'measure': {
            'columnName': null,
            'aggregationFunction': null
          },
          'type': 'socrata.soql',
          'filters': []
        },
        'label': null,
        'type': 'featureMap',
        'unit': {
          'one': 'Thing',
          'other': 'Things'
        }
      }
    ],
    'title': 'Feature Map Example'
  },

  histogram: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'description': '',
    'configuration': {
      'bucketType': 'linear',
      'viewSourceDataLink': true
    },
    'series': [{
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'id',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'type': 'socrata.soql',
        'filters': []
      },
      'label': null,
      'type': 'histogram',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Histogram Example'
  },

  pieChart: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'showValueLabels': true,
      'showValueLabelsAsPercent': false,
      'showOtherCategory': true
    },
    'description': '',
    'series': [{
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'incident_location_address',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'orderBy': {
          'parameter': 'measure',
          'sort': 'desc'
        },
        'type': 'socrata.soql',
        'filters': [],
        'limit': 12
      },
      'label': null,
      'type': 'pieChart',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Pie Chart Example'
  },

  regionMap: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
      'baseLayerOpacity': 0.8,
      'computedColumnName': ':@computed_region_w797_miex',
      'legend': {
        'type': 'continuous',
        'negativeColor': '#c6663d',
        'zeroColor': '#ffffff',
        'positiveColor': '#003747'
      },
      'shapefile': {
        'geometryLabel': 's_hood',
        'primaryKey': 'objectid',
        'uid': 'w797-miex'
      },
      'viewSourceDataLink': true,
      'mapCenterAndZoom': {
        'center': {
          'lat': 47.61497543357878,
          'lng': -122.33600017610198
        },
        'zoom': 10
      }
    },
    'description': '',
    'series': [{
      'color': {},
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'incident_location',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': 'blood_alcohol_level',
          'aggregationFunction': 'sum'
        },
        'type': 'socrata.soql',
        'filters': []
      },
      'label': null,
      'type': 'regionMap',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Region Map Example'
  },

  table: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'order': [
        {
          'ascending': true,
          'columnName': 'id'
        }
      ],
      'viewSourceDataLink': false
    },
    'description': '',
    'series': [{
      'color': {},
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': null,
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'type': 'socrata.soql',
        'filters': []
      },
      'label': null,
      'type': 'table',
      'unit': {
        'one': 'row',
        'other': 'rows'
      }
    }],
    'title': 'Table Example'
  },

  timelineChart: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'xAxisScalingMode': 'fit'
    },
    'description': '',
    'series': [{
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'k6cs-ww27',
        'dimension': {
          'columnName': 'incident_occurrence',
          'aggregationFunction': null
        },
        'domain': 'vertex-stories.test-socrata.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': 'count'
        },
        'type': 'socrata.soql',
        'filters': [],
        'precision': null
      },
      'label': null,
      'type': 'timelineChart',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }],
    'title': 'Timeline Chart Example'
  },

  timelineChartMultipleSeries: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'xAxisScalingMode': 'pan',
      'showLegend': true
    },
    'description': '',
    'series': [
      {
        'color': {
          'primary': '#a6cee3',
          'highlight': '#cccccc',
          'palette': 'categorical',
          'secondary': '#a6cee3'
        },
        'dataSource': {
          'datasetUid': 'k6cs-ww27',
          'dimension': {
            'columnName': 'incident_occurrence',
            'aggregationFunction': null
          },
          'domain': 'vertex-stories.test-socrata.com',
          'measure': {
            'columnName': null,
            'aggregationFunction': 'count'
          },
          'type': 'socrata.soql',
          'filters': [],
          'precision': null,
          'orderBy': {
            'parameter': 'dimension',
            'sort': 'asc'
          }
        },
        'label': null,
        'type': 'timelineChart'
      },
      {
        'color': {
          'primary': '#5b9ec9',
          'highlight': '#cccccc',
          'palette': 'categorical',
          'secondary': '#5b9ec9'
        },
        'dataSource': {
          'datasetUid': 'k6cs-ww27',
          'dimension': {
            'columnName': 'incident_occurrence',
            'aggregationFunction': null
          },
          'domain': 'vertex-stories.test-socrata.com',
          'measure': {
            'columnName': 'blood_alcohol_level',
            'aggregationFunction': 'sum'
          },
          'type': 'socrata.soql',
          'filters': [],
          'precision': null,
          'orderBy': {
            'parameter': 'dimension',
            'sort': 'asc'
          }
        },
        'label': null,
        'type': 'timelineChart'
      }
    ],
    'title': 'Two series'
  },

  timelineChartWithDashedLine: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'xAxisScalingMode': 'pan',
      'showLegend': true
    },
    'description': '',
    'series': [
      {
        'lineStyle': {
          'points': 'closed',
          'pointRadius': 4
        },
        'color': {
          'primary': '#a6cee3',
          'highlight': '#cccccc',
          'palette': 'categorical',
          'secondary': '#a6cee3'
        },
        'dataSource': {
          'datasetUid': 'k6cs-ww27',
          'dimension': {
            'columnName': 'incident_occurrence',
            'aggregationFunction': null
          },
          'domain': 'vertex-stories.test-socrata.com',
          'measure': {
            'columnName': null,
            'aggregationFunction': 'count'
          },
          'type': 'socrata.soql',
          'filters': [
            {
              'function': 'timeRange',
              'columnName': 'incident_occurrence',
              'arguments': {
                'start': '2001-01-01T00:00:00',
                'end': '2001-12-31T23:59:59'
              },
              'isHidden': true
            }
          ],
          'precision': 'month',
          'orderBy': {
            'parameter': 'dimension',
            'sort': 'asc'
          }
        },
        'label': null,
        'type': 'timelineChart'
      },
      {
        'lineStyle': {
          'pattern': 'dashed'
        },
        'color': {
          'primary': '#5b9ec9',
          'highlight': '#cccccc',
          'palette': 'categorical',
          'secondary': '#5b9ec9'
        },
        'dataSource': {
          'datasetUid': 'k6cs-ww27',
          'dimension': {
            'columnName': 'incident_occurrence',
            'aggregationFunction': null
          },
          'domain': 'vertex-stories.test-socrata.com',
          'measure': {
            'columnName': 'blood_alcohol_level',
            'aggregationFunction': 'sum'
          },
          'type': 'socrata.soql',
          'filters': [
            {
              'function': 'timeRange',
              'columnName': 'incident_occurrence',
              'arguments': {
                'start': '2001-01-01T00:00:00',
                'end': '2001-12-31T23:59:59'
              },
              'isHidden': true
            }
          ],
          'precision': 'month',
          'orderBy': {
            'parameter': 'dimension',
            'sort': 'asc'
          }
        },
        'label': null,
        'type': 'timelineChart'
      }
    ],
    'title': 'With one solid and one dashed line'
  },

  timelineChartWithCategoricalData: {
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'configuration': {
      'viewSourceDataLink': true,
      'xAxisScalingMode': 'pan'
    },
    'description': '',
    'series': [
      {
        'color': {
          'primary': '#71abd9',
          'highlight': '#cccccc'
        },
        'dataSource': {
          'datasetUid': 'k6cs-ww27',
          'dimension': {
            'columnName': 'id',
            'aggregationFunction': null
          },
          'domain': 'vertex-stories.test-socrata.com',
          'measure': {
            'columnName': 'blood_alcohol_level',
            'aggregationFunction': 'sum'
          },
          'type': 'socrata.soql',
          'filters': [],
          'precision': null,
          'orderBy': {
            'parameter': 'measure',
            'sort': 'desc'
          }
        },
        'label': null,
        'type': 'timelineChart'
      }
    ],
    'title': 'Categorical data'
  },

  timelineChartWithOpenDot: {
    configuration: {
      dimensionAxisMinValue: '1999-01-01T00:00:00.000',
      dimensionAxisMaxValue: '2005-01-01T00:00:00.000'
    },
    series: [
      {
        lineStyle: {
          points: 'last-open',
          pointRadius: 4
        },
        dataSource: {
          datasetUid: '52my-2pak',
          dimension: {
            columnName: 'date',
            aggregationFunction: null
          },
          domain: 'dataspace.demo.socrata.com',
          measure: {
            columnName: null,
            aggregationFunction: 'count'
          },
          type: 'socrata.soql',
          filters: [
            {
              arguments: {
                start: '2001-01-01T00:00:00.000',
                end: '2003-06-01T00:00:00.000'
              },
              columnName: 'date',
              'function': 'timeRange'
            }
          ],
          precision: 'MONTH'
        },
        label: 'Incidents',
        type: 'timelineChart',
        unit: {
          one: 'incident',
          other: 'incidents'
        }
      }
    ],
    createdAt: '2014-01-01T00:00:00',
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    title: 'Open final dot, custom x axis scale'
  },

  // This is trying to emulate what KPIs will provide.
  timelineChartInlinePlain: {
    configuration: {
      dimensionAxisMinValue: '2000-12-01T00:00:00.000',
      dimensionAxisMaxValue: '2003-12-01T00:00:00.000'
    },
    series: [
      {
        lineStyle: {
          points: 'last-open',
          pointRadius: 4
        },
        // Main data from measure calculation.
        dataSource: {
          precision: 'MONTH',
          dimension: {
            columnName: 'date',
            aggregationFunction: null
          },
          measure: {
            // KPIs should set each measure columnName to something unique.
            columnName: 'kpi_calculation',
            // KPIs should adjust this between 'count' and 'sum'. It affects the granularity of
            // the Y axis (integers vs. decimals).
            aggregationFunction: 'count'
          },
          type: 'socrata.inline',
          rows: [
            [
              '2001-01-01T00:00:00.000',
              38063 // These can be strings.
            ],
            [
              '2001-02-01T00:00:00.000',
              33772
            ],
            [
              '2001-03-01T00:00:00.000',
              40549
            ],
            [
              '2001-04-01T00:00:00.000',
              40075
            ],
            [
              '2001-05-01T00:00:00.000',
              41809
            ],
            [
              '2001-06-01T00:00:00.000',
              41713
            ],
            [
              '2001-07-01T00:00:00.000',
              44687
            ],
            [
              '2001-08-01T00:00:00.000',
              44022
            ],
            [
              '2001-09-01T00:00:00.000',
              41496
            ],
            [
              '2001-10-01T00:00:00.000',
              43020
            ],
            [
              '2001-11-01T00:00:00.000',
              39593
            ],
            [
              '2001-12-01T00:00:00.000',
              36839
            ],
            [
              '2002-01-01T00:00:00.000',
              38376
            ],
            [
              '2002-02-01T00:00:00.000',
              33902
            ],
            [
              '2002-03-01T00:00:00.000',
              38572
            ],
            [
              '2002-04-01T00:00:00.000',
              40016
            ],
            [
              '2002-05-01T00:00:00.000',
              42909
            ],
            [
              '2002-06-01T00:00:00.000',
              42825
            ],
            [
              '2002-07-01T00:00:00.000',
              46007
            ],
            [
              '2002-08-01T00:00:00.000',
              44211
            ],
            [
              '2002-09-01T00:00:00.000',
              42377
            ],
            [
              '2002-10-01T00:00:00.000',
              43141
            ],
            [
              '2002-11-01T00:00:00.000',
              37148
            ],
            [
              '2002-12-01T00:00:00.000',
              37166
            ],
            [
              '2003-01-01T00:00:00.000',
              36688
            ],
            [
              '2003-02-01T00:00:00.000',
              32500
            ],
            [
              '2003-03-01T00:00:00.000',
              38644
            ],
            [
              '2003-04-01T00:00:00.000',
              39785
            ],
            [
              '2003-05-01T00:00:00.000',
              41186
            ]
          ]
        },
        label: 'Fake KPI data',
        type: 'timelineChart',
        unit: {
          one: 'incident',
          other: 'incidents'
        }
      }
    ],
    createdAt: '2014-01-01T00:00:00',
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    title: 'Inline data, open final dot, custom x axis scale',
    subtitle: 'Usage similar to KPIs'
  },

  // This is trying to emulate what KPIs will provide.
  timelineChartInlineWithTargets: {
    configuration: {
      dimensionAxisMinValue: '2000-12-01T00:00:00.000',
      dimensionAxisMaxValue: '2003-12-01T00:00:00.000'
    },
    series: [
      {
        lineStyle: {
          points: 'last-open',
          pointRadius: 4
        },
        // Main data from measure calculation.
        dataSource: {
          precision: 'MONTH',
          dimension: {
            columnName: 'date',
            aggregationFunction: null
          },
          measure: {
            // KPIs should set each measure columnName to something unique.
            columnName: 'kpi_calculation',
            // KPIs should adjust this between 'count' and 'sum'. It affects the granularity of
            // the Y axis (integers vs. decimals).
            aggregationFunction: 'count'
          },
          type: 'socrata.inline',
          rows: [
            [
              '2001-01-01T00:00:00.000',
              38063, // These can be strings.
              // Target line data. See big comment in next series data source to learn why it's here.
              null
            ],
            [
              '2001-02-01T00:00:00.000',
              33772,
              40000
            ],
            [
              '2001-03-01T00:00:00.000',
              40549,
              40000
            ],
            [
              '2001-04-01T00:00:00.000',
              40075,
              // TODO: We want a sharp discontinuity here. We'll deal with that when we do KPI targets.
              // Probably, this will be done by having a whole series per target. That way we don't have
              // to worry about sloped lines.
              null
            ],
            [
              '2001-05-01T00:00:00.000',
              41809,
              45000
            ],
            [
              '2001-06-01T00:00:00.000',
              41713,
              45000
            ],
            [
              '2001-07-01T00:00:00.000',
              44687,
              null
            ],
            [
              '2001-08-01T00:00:00.000',
              44022,
              33333
            ],
            [
              '2001-09-01T00:00:00.000',
              41496,
              33333
            ],
            [
              '2001-10-01T00:00:00.000',
              43020,
              33333
            ],
            [
              '2001-11-01T00:00:00.000',
              39593,
              33333
            ],
            [
              '2001-12-01T00:00:00.000',
              36839,
              33333
            ],
            [
              '2002-01-01T00:00:00.000',
              38376,
              33333
            ],
            [
              '2002-02-01T00:00:00.000',
              33902,
              null
            ],
            [
              '2002-03-01T00:00:00.000',
              38572,
              null
            ],
            [
              '2002-04-01T00:00:00.000',
              40016,
              null
            ],
            [
              '2002-05-01T00:00:00.000',
              42909,
              null
            ],
            [
              '2002-06-01T00:00:00.000',
              42825,
              null
            ],
            [
              '2002-07-01T00:00:00.000',
              46007,
              null
            ],
            [
              '2002-08-01T00:00:00.000',
              44211,
              null
            ],
            [
              '2002-09-01T00:00:00.000',
              42377,
              null
            ],
            [
              '2002-10-01T00:00:00.000',
              43141,
              null
            ],
            [
              '2002-11-01T00:00:00.000',
              37148,
              null
            ],
            [
              '2002-12-01T00:00:00.000',
              37166,
              null
            ],
            [
              '2003-01-01T00:00:00.000',
              36688,
              null
            ],
            [
              '2003-02-01T00:00:00.000',
              32500,
              null
            ],
            [
              '2003-03-01T00:00:00.000',
              38644,
              null
            ],
            [
              '2003-04-01T00:00:00.000',
              39785,
              null
            ],
            [
              '2003-05-01T00:00:00.000',
              41186,
              null
            ]
          ]
        },
        label: 'Fake KPI data',
        type: 'timelineChart',
        unit: {
          one: 'incident',
          other: 'incidents'
        }
      },
      {
        lineStyle: {
          pattern: 'dashed'
        },
        color: {
          primary: '#ff1010',
          highlight: 'orange' // Or something - confirm with design.
        },
        // Main data from measure calculation.
        // !IMPORTANT! A timeline with multiple series must merge its series data
        // together into a single array of chronologically-ordered rows. We could
        // do this automatically, but there's no need to go through this rigamarole
        // yet.  KPIs is the only user of inline-sourced timeline charts, and even
        // then it will only use multi-series to render piecewise target markers.
        // We're not quite sure what form these target markers will take, so we should
        // wait to see before investing a lot of effort in an automatic bucket-merging
        // solution.
        //
        // So, all this to say: All inline data comes from the first series. See the
        // previous series for the data corresponding to this dashed line.
        dataSource: {
          precision: 'MONTH',
          dimension: {
            columnName: 'date',
            aggregationFunction: null
          },
          measure: {
            // KPIs should set each measure columnName to something unique.
            columnName: 'target_2',
            // KPIs should adjust this between 'count' and 'sum'. It affects the granularity of
            // the Y axis (integers vs. decimals).
            aggregationFunction: 'count'
          },
          type: 'socrata.inline'
        },
        label: 'Target 2',
        type: 'timelineChart',
        unit: {
          one: 'incident',
          other: 'incidents'
        }
      }
    ],
    createdAt: '2014-01-01T00:00:00',
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    title: 'Inline data, open final dot, custom x axis scale, with targets',
    subtitle: 'Usage similar to KPIs',
    referenceLines: [
      {
        color: '#ff1010',
        label: 'Target 1',
        uId: 'reference-line-9',
        value: 40000
      }
    ]
  },

  invalidChart: {}
};
