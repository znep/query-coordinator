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
        "domain": "example.com",
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
    }
  ],
  "title": "Outer Orbit Adventures"
};
