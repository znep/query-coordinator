export const customPalette = {
  '1': {
    'color': '#f16666',
    'index': 8
  },
  '2': {
    'color': '#e42022',
    'index': 9
  },
  '3': {
    'color': '#a6cee3',
    'index': 0
  },
  '4': {
    'color': '#7eba98',
    'index': 3
  },
  '5': {
    'color': '#2d82af',
    'index': 2
  },
  '6': {
    'color': '#98d277',
    'index': 4
  },
  '7': {
    'color': '#dc9a88',
    'index': 7
  },
  '8': {
    'color': '#5b9ec9',
    'index': 1
  },
  '9': {
    'color': '#52af43',
    'index': 5
  },
  '10': {
    'color': '#6f9e4c',
    'index': 6
  },
  '(Other)': {
    'color': '#fdbb69',
    'index': 11
  },
  '(No value)': {
    'color': '#f06c45',
    'index': 10
  }
};

export const customPaletteVif = {
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'configuration': {
    'viewSourceDataLink': true,
    'showDimensionLabels': true,
    'xAxisScalingMode': 'pan',
    'showLegend': true
  },
  'description': '',
  'series': [
    {
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc',
        'palette': 'custom'
      },
      'dataSource': {
        'datasetUid': 'mock-viif',
        'dimension': {
          'columnName': 'plausibility',
          'aggregationFunction': null
        },
        'domain': 'example.com',
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
      'type': 'pieChart'
    }
  ],
  'title': ''
};
