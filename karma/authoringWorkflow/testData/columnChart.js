export default () => ({
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "configuration": {
    "xAxisScalingMode": "pan",
    "viewSourceDataLink": true,
    "axisLabels": {
      "bottom": "All The Time",
      "left": "Love You"
    }
  },
  "description": "My darling dear.",
  "series": [
    {
      "color": {
        "primary": "#ec3001",
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
          "columnName": "blood_alcohol_level",
          "aggregationFunction": "sum"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "columnChart",
      "unit": {
        "one": "Fool",
        "other": "Fools"
      }
    }
  ],
  "title": "Earth Angel"
});
