export default () => ({
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'configuration': {
    'showDimensionLabels': true,
    'showValueLabels': true,
    'xAxisScalingMode': 'pan',
    'viewSourceDataLink': true,
    'axisLabels': {
      'top': 'All The Time',
      'left': 'Love You'
    }
  },
  'description': 'My darling dear.',
  'series': [
    {
      'color': {
        'primary': '#ec3001',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
      },
      'dataSource': {
        'datasetUid': 'mock-viif',
        'dimension': {
          'columnName': 'blood_alcohol_level',
          'aggregationFunction': null
        },
        'domain': 'example.com',
        'measure': {
          'columnName': 'blood_alcohol_level',
          'aggregationFunction': 'sum'
        },
        'type': 'socrata.soql',
        'filters': [],
        'orderBy': {
          'parameter': 'measure',
          'sort': 'desc'
        }
      },
      'label': null,
      'type': 'barChart',
      'unit': {
        'one': 'Fool',
        'other': 'Fools'
      }
    }
  ],
  'title': 'Earth Angel'
});
