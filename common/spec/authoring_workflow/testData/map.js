export default () => ({
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'configuration': {
    'baseLayerUrl': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
    'baseLayerOpacity': 0.2,
    'datasetMetadata': false,
    'geoCoderControl': true,
    'geoLocateControl': true,
    'rowInspectorTitleColumnName': 'incident_location',
    'locateUser': false,
    'panAndZoom': true,
    'mapCenterAndZoom': {
      'center': {
        'lat': 32.66073764743223,
        'lng': -89.84889049999998
      },
      'zoom': 6
    },
    'navigationControl': true,
    'pointOpacity': 0.3,
    'pointSize': 1,
    'viewSourceDataLink': true
  },
  'description': 'Stars shining bright above you.',
  'series': [
    {
      'color': {
        'primary': '#894baa'
      },
      'dataSource': {
        'datasetUid': 'mock-viif',
        'dimension': {
          'columnName': 'incident_location',
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
      'unit': {
        'one': 'Dream',
        'other': 'Dreams'
      }
    }
  ],
  'title': 'Dream A Little Dream'
});
