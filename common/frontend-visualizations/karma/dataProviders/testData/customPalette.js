export const customPalette = {
  '1': {
    'color': '#e42022',
    'index': 9
  },
  '2': {
    'color': '#f16666',
    'index': 8
  },
  '3': {
    'color': '#dc9a88',
    'index': 7
  },
  '4': {
    'color': '#6f9e4c',
    'index': 6
  },
  '5': {
    'color': '#52af43',
    'index': 5
  },
  '6': {
    'color': '#98d277',
    'index': 4
  },
  '7': {
    'color': '#7eba98',
    'index': 3
  },
  '8': {
    'color': '#2d82af',
    'index': 2
  },
  '9': {
    'color': '#5b9ec9',
    'index': 1
  },
  '10': {
    'color': '#a6cee3',
    'index': 0
  }
};

export const customPaletteVif = {
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "configuration": {
    "viewSourceDataLink": true,
    "showDimensionLabels": true,
    "xAxisScalingMode": "pan",
    "showLegend": true
  },
  "description": "",
  "series": [
    {
      "color": {
        "primary": "#71abd9",
        "secondary": "#71abd9",
        "highlight": "#cccccc",
        "palette": "custom"
      },
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "plausibility",
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
        "orderBy": {
          "parameter": "measure",
          "sort": "desc"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "columnChart"
    }
  ],
  "title": ""
};
