export default {
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "description": "Elephants in Space",
  "configuration": {
    "bucketType": "linear",
    "viewSourceDataLink": true,
    "measureAxisMinValue": 50,
    "measureAxisMaxValue": 200
  },
  "series": [
    {
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "plausibility",
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
    },
    {
      "color": {
        "primary": "#aaaaaa",
        "secondary": "#bbbbbb",
        "highlight": "#000000"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "plausibility",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "sum"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": "A Label",
      "type": "timelineChart",
      "unit": {
        "one": "Banana",
        "other": "Bananas"
      }
    }
  ],
  "title": "Outer Orbit Adventures"
};
