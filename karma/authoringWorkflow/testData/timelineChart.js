export default () => ({
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "configuration": {
    "xAxisScalingMode": "fit",
    "axisLabels": {
      "bottom": "Trucking",
      "left": "Keep"
    }
  },
  "description": "Description",
  "series": [
    {
      "color": {
        "primary": "#6ac5a3",
        "secondary": "#067126",
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
        "filters": []
      },
      "label": null,
      "type": "timelineChart",
      "unit": {
        "one": "Where",
        "other": "Wheres"
      }
    }
  ],
  "title": "Title"
});
