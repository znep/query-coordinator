export const UnifiedMapVif = (overrides) => {
  let base = {
    'configuration': {
      'viewSourceDataLink': false,
      'interactive': false,
      'panAndZoom': true,
      'locateUser': true
    },
    'series': [{
      'color': {
        'primary': '#eb6900',
        'palette': 'alternate1'
      },
      'dataSource': {
        'datasetUid': 'r6t9-rak2',
        'dimension': {
          'columnName': 'point',
          'aggregationFunction': null
        },
        'domain': 'example.com',
        'measure': {
          'columnName': null,
          'aggregationFunction': null
        },
        'type': 'socrata.soql',
        'filters': []
      },
      'label': null,
      'type': 'map',
      'mapOptions': {},
      'unit': {
        'one': 'Thing',
        'other': 'Things'
      }
    }],
    'domain': 'example.com',
    'filters': [],
    'format': {
      'type': 'visualization_interchange_format',
      'version': 2
    },
    'description': 'Description from VIF',
    'title': 'Title'
  };

  return Object.assign({}, base, overrides);
};
