export default () => ({
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'configuration': {
    'showLegend': true,
    'viewSourceDataLink': true,
    'xAxisScalingMode': 'fit'
  },
  'description': '',
  'series': [
    {
      'color': {
        'primary': '#71abd9',
        'highlight': '#cccccc',
        'palette': 'accent'
      },
      'dataSource': {
        'datasetUid': 'mock-viif',
        'dimension': {
          'columnName': 'incident_occurrence',
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
        'type': 'socrata.soql',
        'filters': [],
        'precision': null,
        'orderBy':{
          'parameter': 'dimension',
          'sort': 'asc'
        }
      },
      'label': null,
      'type': 'timelineChart',
      'unit': {
        'one': 'Row',
        'other': 'Rows'
      }
    }
  ],
  'title': ''
});
