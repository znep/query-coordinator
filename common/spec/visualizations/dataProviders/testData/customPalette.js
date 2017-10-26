export const customPalette = {
  '1': {
    'color': '#f06c45',
    'index': 10
  },
  '2': {
    'color': '#e42022',
    'index': 9
  },
  '3': {
    'color': '#f16666',
    'index': 8
  },
  '4': {
    'color': '#dc9a88',
    'index': 7
  },
  '5': {
    'color': '#6f9e4c',
    'index': 6
  },
  '6': {
    'color': '#52af43',
    'index': 5
  },
  '7': {
    'color': '#98d277',
    'index': 4
  },
  '8': {
    'color': '#7eba98',
    'index': 3
  },
  '9': {
    'color': '#2d82af',
    'index': 2
  },
  '10': {
    'color': '#5b9ec9',
    'index': 1
  },
  '(No value)': {
    'color': '#a6cee3',
    'index': 0
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
          'aggregationFunction': null,
          'grouping': {
            'columnName': 'plausibility'
          }
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
      'type': 'columnChart'
    }
  ],
  'title': ''
};
