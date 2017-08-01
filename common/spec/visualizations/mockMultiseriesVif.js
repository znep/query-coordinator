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
    "measureAxisMaxValue": 200,
    // If you change to true, make sure to mock out the resultant MetadataProvider request.
    "viewSourceDataLink": false
  },
  "series": [
    {
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc"
      },
      "dataSource": {
        "datasetUid": "mock-viif",
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
    },
    {
      "color": {
        "primary": "#aaaaaa",
        "secondary": "#bbbbbb",
        "highlight": "#000000"
      },
      "dataSource": {
        "datasetUid": "mock-viif",
        "dimension": {
          "columnName": "plausibility",
          "aggregationFunction": null
        },
        "domain": "example.com",
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
