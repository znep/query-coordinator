export default () => ({
  'format': {
    'type': 'visualization_interchange_format',
    'version': 2
  },
  'configuration': {
    'baseMapStyle': 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png',
    'baseMapOpacity': 0.2,
    'datasetMetadata': false,
    'locateUser': false,
    'geoCoderControl': true,
    'geoLocateControl': true,
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
      },
      'mapOptions': {
        'clusterRadius': 50,
        'colorLinesBy': 'columnName',
        'colorPointsBy': 'columnName',
        'lineWeight': 5,
        'mapFlyoutTitleColumnName': 'incident_location',
        'mapType': 'pointMap',
        'maxClusteringZoomLevel': 8,
        'maxClusterSize': 24,
        'maximumLineWeight': 7,
        'maximumPointSize': 7,
        'minimumLineWeight': 3,
        'minimumPointSize': 3,
        'numberOfDataClasses': 5,
        'pointAggregation': 'heat_map',
        'pointMapPointSize': 4,
        'pointThreshold': 4500,
        'resizePointsBy': 'columnName',
        'stackRadius': 20,
        'weighLinesBy': 'columnName'
      }
    }
  ],
  'title': 'Dream A Little Dream'
});
