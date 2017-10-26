import _ from 'lodash';
var TileserverDataProvider = require('common/visualizations/dataProviders/TileserverDataProvider');

describe('TileserverDataProvider', function() {

  var VALID_DOMAIN = 'example.com';
  var VALID_DATASET_UID = 'test-test';
  var VALID_COLUMN_NAME = 'point';
  var VALID_FEATURES_PER_TILE = 256 * 256;

  var VALID_CONFIG = {
    domain: VALID_DOMAIN,
    datasetUid: VALID_DATASET_UID,
    columnName: VALID_COLUMN_NAME,
    featuresPerTile: VALID_FEATURES_PER_TILE
  };

  var VALID_WHERE_CLAUSE = '%60source%60%3D%27Voice+In%27';
  var VALID_ZOOM = 10;
  var VALID_X = 1;
  var VALID_Y = 1;

  var TILESERVER_HOST_PATTERN = VALID_DOMAIN;
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
            domain: undefined,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: undefined,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: VALID_FEATURES_PER_TILE
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: undefined,
            featuresPerTile: VALID_FEATURES_PER_TILE
          });
        });

        assert.throw(function() {

          var tileserverDataProvider = new TileserverDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: VALID_DATASET_UID,
            columnName: VALID_COLUMN_NAME,
            featuresPerTile: undefined
          });
        });
      });
    });
  });

  var fakeXhr;
  var onXhrSend = _.noop;
  beforeEach(function() {
    fakeXhr = sinon.useFakeXMLHttpRequest();
    fakeXhr.onCreate = (xhr) => {
      xhr.onSend = () => {
        try {
          onXhrSend(xhr);
        } catch (e) {
          // Log the error, otherwise sinon eats it.
          console.error(e.message);
          console.error(e.stack);
          throw e;
        }
      };
    };
  });

  afterEach(function() {
    fakeXhr.restore();
  });

  describe('buildTileGetter', function() {

    var tileserverDataProvider;

    beforeEach(function() {
      tileserverDataProvider = new TileserverDataProvider(
        VALID_CONFIG
      );
    });

    describe('when called with no arguments', function() {

      it('should return a function that gets a URL', function(done) {

        var tileGetter = tileserverDataProvider.buildTileGetter();

        assert.isFunction(tileGetter);

        onXhrSend = (request) => {
          assert.equal(request.method, 'GET');

          assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));

          assert.match(request.url, new RegExp(TILE_PATTERN));
          assert.notMatch(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
          done();
        };

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
      });
    });

    describe('when called with an empty where clause', function() {

      it('should return a function that gets a URL', function(done) {

        var tileGetter = tileserverDataProvider.buildTileGetter('', false);

        assert.isFunction(tileGetter);

        onXhrSend = (request) => {
          assert.equal(request.method, 'GET');

          assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));

          assert.match(request.url, new RegExp(TILE_PATTERN));
          assert.notMatch(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
          done();
        };

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
      });
    });

    describe('when called with a present where clause', function() {

      it('should return a function that gets a URL including the specified where clause', function(done) {

        var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE, false);

        assert.isFunction(tileGetter);

        onXhrSend = (request) => {
          assert.equal(request.method, 'GET');

          assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));

          assert.match(request.url, new RegExp(TILE_PATTERN));
          assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
          done();
        };

        tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
      });
    });

    it('should return a function that gets a URL on a tileserver host', function(done) {

      var tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE);

      assert.isFunction(tileGetter);

      onXhrSend = (request) => {
        assert.equal(request.method, 'GET');

        assert.match(request.url, new RegExp(TILESERVER_HOST_PATTERN));

        assert.match(request.url, new RegExp(TILE_PATTERN));
        assert.match(request.url, new RegExp(WHERE_CLAUSE_PATTERN));
        done();
      };

      tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
    });
  });

  describe('caching behavior', () => {

    let tileserverDataProvider;

    beforeEach(() => {
      tileserverDataProvider = new TileserverDataProvider(VALID_CONFIG);
    });

    it('only sends one request', (done) => {

      let tileGetter = tileserverDataProvider.buildTileGetter(VALID_WHERE_CLAUSE, false);

      let counter = 0;
      onXhrSend = (request) => {
        counter++;
        request.respond(200);
      };

      const p1 = tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
      const p2 = tileGetter(VALID_ZOOM, VALID_X, VALID_Y);
      const p3 = tileGetter(VALID_ZOOM, VALID_X, VALID_Y);

      Promise.all([p1, p2, p3]).then((values) => {
        assert.equal(counter, 1);
        done();
      });

    });

  });

});
