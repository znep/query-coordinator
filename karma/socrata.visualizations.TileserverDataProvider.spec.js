describe('socrata.visualizations.TileserverDataProvider', function() {

  'use strict';

  var VALID_APP_TOKEN = 'validAppToken';
  var VALID_DOMAIN = 'example.com';
  var VALID_DATASET_UID = 'test-test';
  var VALID_COLUMN_NAME = 'point';
  var VALID_FEATURES_PER_TILE = 256 * 256;
  var VALID_TILESERVER_HOSTS = ['api1.example.com', 'api2.example.com'];

  var VALID_CONFIG = {
    appToken: VALID_APP_TOKEN,
    domain: VALID_DOMAIN,
    datasetUid: VALID_DATASET_UID,
    columnName: VALID_COLUMN_NAME,
    featuresPerTile: VALID_FEATURES_PER_TILE,
    tileserverHosts: VALID_TILESERVER_HOSTS
  };

  var VALID_WHERE_CLAUSE = '%60source%60%3D%27Voice+In%27';
  var VALID_ZOOM = 10;
  var VALID_X = 1;
  var VALID_Y = 1;

  var TILESERVER_HOST_PATTERN = 'api[12]\\.example\\.com';
  var ORIGIN_HOST_PATTERN = window.location.host;
  var TILE_PATTERN = 'tiles\\/{0}\\/{1}\\/{2}\\/{3}\\/{4}\\.pbf'.format(
    VALID_DATASET_UID.split('-').join('\\-'),
    VALID_COLUMN_NAME,
    VALID_ZOOM,
    VALID_X,
    VALID_Y
  );
  var WHERE_CLAUSE_PATTERN = VALID_WHERE_CLAUSE.replace(/\+/, '\\+');

  describe('constructor', function() {

    describe('when called with invalid configuration options', function() {

      var tileserverDataProvider;

      it('should throw', function() {

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: null,
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE,
            tileserverHosts: VALID_TILESERVER_HOSTS
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: VALID_APP_TOKEN,
            domain: null,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE,
            tileserverHosts: VALID_TILESERVER_HOSTS
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: VALID_APP_TOKEN,
            domain: VALID_DOMAIN,
            datasetUid: null,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE,
            tileserverHosts: VALID_TILESERVER_HOSTS
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: VALID_APP_TOKEN,
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: null,
            featuresPerTile: VALID_FEATURES_PER_TILE,
            tileserverHosts: VALID_TILESERVER_HOSTS
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: VALID_APP_TOKEN,
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: null,
            tileserverHosts: VALID_TILESERVER_HOSTS
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            appToken: VALID_APP_TOKEN,
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE,
            tileserverHosts: null
          });
        });
      });
    });
  });

  describe('buildTileGetter', function() {

    var server;
    var requests = [];
    var request;
    var tileserverDataProvider;

    beforeEach(function() {

      server = sinon.fakeServer.create();
      tileserverDataProvider = new socrata.visualizations.TileserverDataProvider(
        VALID_CONFIG
      );
    });

    afterEach(function() {
      server.restore();
    });

    describe('when called with no arguments', function() {

      it('should return a function that gets a URL', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter();

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.notMatch(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.notMatch(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });

    describe('when called with an empty where clause', function() {

      it('should return a function that gets a URL', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter('', false);

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.notMatch(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.notMatch(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });

    describe('when called with a present where clause', function() {

      it('should return a function that gets a URL including the specified where clause', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE, false);

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.notMatch(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });

    describe('when called with useOriginHost undefined', function() {

      it('should return a function that gets a URL on a tileserver host', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE);

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.notMatch(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });

    describe('when called with useOriginHost set to false', function() {

      it('should return a function that gets a URL on a tileserver host', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE, false);

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.notMatch(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });

    describe('when called with useOriginHost set to true', function() {

      it('should return a function that gets a URL on the origin host', function() {

        var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE, true);

        assert.isFunction(tileGetter);

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

        request = server.requests[0];

        assert.equal(request.method, 'GET');
        assert.propertyVal(request.requestHeaders, 'X-App-Token', VALID_APP_TOKEN);

        assert.notMatch(request.url, new RegExp(TILESERVER_HOST_PATTERN));
        assert.match(request.url, new RegExp(ORIGIN_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
      });
    });
  });
});
