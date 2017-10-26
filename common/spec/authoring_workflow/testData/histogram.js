export default () => ({
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'description': 'Known to you.',
  'configuration': {
    'bucketType': 'linear',
    'axisLabels': {
      'bottom': 'And Listen',
      'left': 'Understand'
    },
    'viewSourceDataLink': true
  },
  'series': [
    {
      'color': {
        'primary': '#31a75a',
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
        'filters': []
      },
      'label': null,
      'type': 'histogram',
      'unit': {
        'one': 'Ear',
        'other': 'Ears'
      }
    }
  ],
  'title': 'Yes, there it is.'
});
