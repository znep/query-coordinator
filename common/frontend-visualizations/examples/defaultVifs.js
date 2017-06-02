window.defaultVifs = {
  barChart: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "viewSourceDataLink": true,
      "showDimensionLabels": true,
      "showValueLabels": true,
      "xAxisScalingMode": "pan",
      "showOtherCategory": true
    },
    "description": "",
    "series": [{
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "blood_alcohol_level",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "orderBy": {
          "parameter": "measure",
          "sort": "desc"
        },
        "type": "socrata.soql",
        "filters": [],
        "limit": 10
      },
      "label": null,
      "type": "barChart",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Bar Chart Example"
  },

  columnChart: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "viewSourceDataLink": true,
      "showDimensionLabels": true,
      "xAxisScalingMode": "pan"
    },
    "description": "",
    "series": [{
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "id",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "orderBy": {
          "parameter": "measure",
          "sort": "desc"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "columnChart",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Column Chart Example"
  },

  featureMap: {
    "format": {
      "type": 'visualization_interchange_format',
      "version": 2
    },
    "configuration": {
      "datasetMetadata": false,
      "interactive": true,
      "panAndZoom": true,
      "locateUser": true,
      "pointOpacity": '0.24',
      "baseLayerUrl": 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
      "baseLayerOpacity": 0.8
    },
    "series": [
      {
        "color": {
          "primary": '#0088ff'
        },
        "dataSource": {
          "datasetUid": 'r6t9-rak2',
          "dimension": {
            "columnName": 'point',
            "aggregationFunction": null
          },
          "domain": 'dataspace.demo.socrata.com',
          "measure": {
            "columnName": null,
            "aggregationFunction": null
          },
          "type": 'socrata.soql',
          "filters": [],
        },
        "label": null,
        "type": 'featureMap',
        "unit": {
          "one": 'Thing',
          "other": 'Things'
        }
      }
    ],
    "title": 'Feature Map Example'
  },

  histogram: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "description": "",
    "configuration": {
      "bucketType": "linear",
      "viewSourceDataLink": true
    },
    "series": [{
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "id",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "histogram",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Histogram Example"
  },

  pieChart: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "viewSourceDataLink": true,
      "showValueLabels": true,
      "showValueLabelsAsPercent": false,
      "showOtherCategory": true
    },
    "description": "",
    "series": [{
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "incident_location_address",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "orderBy": {
          "parameter": "measure",
          "sort": "desc"
        },
        "type": "socrata.soql",
        "filters": [],
        "limit": 12
      },
      "label": null,
      "type": "pieChart",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Pie Chart Example"
  },

  regionMap: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "baseLayerUrl": "https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png",
      "baseLayerOpacity": 0.8,
      "computedColumnName": ":@computed_region_w797_miex",
      "legend": {
        "type": "continuous",
        "negativeColor": "#c6663d",
        "zeroColor": "#ffffff",
        "positiveColor": "#003747"
      },
      "shapefile": {
        "geometryLabel": "s_hood",
        "primaryKey": "objectid",
        "uid": "w797-miex"
      },
      "viewSourceDataLink": true,
      "mapCenterAndZoom": {
        "center": {
          "lat": 47.61497543357878,
          "lng": -122.33600017610198
        },
        "zoom": 10
      }
    },
    "description": "",
    "series": [{
      "color": {},
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "incident_location",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": "blood_alcohol_level",
          "aggregationFunction": "sum"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "regionMap",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Region Map Example"
  },

  table: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "order": [
        {
          "ascending": true,
          "columnName": "id"
        }
      ],
      "viewSourceDataLink": false
    },
    "description": "",
    "series": [{
      "color": {},
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": null,
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "table",
      "unit": {
        "one": "row",
        "other": "rows"
      }
    }],
    "title": "Table Example"
  },

  timelineChart: {
    "format": {
      "type": "visualization_interchange_format",
      "version": 2
    },
    "configuration": {
      "viewSourceDataLink": true,
      "xAxisScalingMode": "fit"
    },
    "description": "",
    "series": [{
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "incident_occurrence",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "type": "socrata.soql",
        "filters": [],
        "precision": null
      },
      "label": null,
      "type": "timelineChart",
      "unit": {
        "one": "Row",
        "other": "Rows"
      }
    }],
    "title": "Timeline Chart Example"
  },

  invalidChart: {}
};
