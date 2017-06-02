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
        "filters": [
          {
            "function": "valueRange",
            "columnName": "blood_alcohol_level",
            "arguments": {
              "start": 0.25,
              "end": 0.5001
            },
            "isHidden": true
          }
        ]
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
