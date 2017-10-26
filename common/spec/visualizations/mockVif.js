export default {
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'description': 'Elephants in Space',
  'configuration': {
    'bucketType': 'linear',
    'measureAxisMinValue': 50,
    'measureAxisMaxValue': 200,
    // If you change to true, make sure to mock out the resultant MetadataProvider request.
    'viewSourceDataLink': false
  },
  'series': [
    {
      'color': {
        'primary': '#71abd9',
        'secondary': '#71abd9',
        'highlight': '#cccccc'
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
        'type': 'socrata.soql',
        'filters': [
          {
            'function': 'valueRange',
            'columnName': 'blood_alcohol_level',
            'arguments': {
              'start': 0.25,
              'end': 0.5001
            },
            'isHidden': true
          }
        ]
      },
      'label': null,
      'type': 'histogram',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }
  ],
  'title': 'Outer Orbit Adventures'
};
