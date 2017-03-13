export default () => ({
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "configuration": {
    "viewSourceDataLink": true,
    "xAxisScalingMode": "fit"
  },
  "description": null,
  "series": [
    {
      "color": {
        "primary": "#71abd9",
        "highlight": "#cccccc",
        "palette": "accent"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "incident_occurrence",
          "aggregationFunction": null,
          "grouping": {
            "columnName": "plausibility"
          }
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
    }
  ],
  "title": null
});
