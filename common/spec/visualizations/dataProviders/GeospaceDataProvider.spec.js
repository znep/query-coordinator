var GeospaceDataProvider = require('common/visualizations/dataProviders/GeospaceDataProvider');

describe('GeospaceDataProvider', function() {
  var SOUTHWEST_EXTENT_LNG = -122.513300926011;
  var SOUTHWEST_EXTENT_LAT = 37.707360625;
  var NORTHEAST_EXTENT_LNG = -122.361277017;
  var NORTHEAST_EXTENT_LAT = 37.829992142;
  var VALID_DOMAIN = 'localhost:9443';
  var VALID_DATASET_UID = 'test-test';
  var VALID_COLUMN_NAME = 'point';
  var VALID_EXTENT = {
    northeast: [NORTHEAST_EXTENT_LAT, NORTHEAST_EXTENT_LNG],
    southwest: [SOUTHWEST_EXTENT_LAT, SOUTHWEST_EXTENT_LNG]
  };
  var INVALID_DOMAIN = null;
  var INVALID_DATASET_UID = null;
  var INVALID_COLUMN_NAME = 'npoint';
  var ERROR_STATUS = 400;
  var ERROR_MESSAGE = 'Bad request';
  var SUCCESS_STATUS = 200;
  var SAMPLE_EXTENT_REQUEST_ERROR = JSON.stringify({
    'message': 'query.soql.no-such-column',
    'errorCode': 'query.soql.no-such-column',
    'data': {
      'data': {
        'column': 'npoint',
        'dataset': 'alpha.90',
        'position': {
          'row': 1,
          'column': 15,
          'line': 'SELECT extent(`npoint`)\n              ^'
        }
      }
    }
  });
  var SAMPLE_EXTENT_REQUEST_RESPONSE = JSON.stringify([
    {
      'extent_point': {
        'type': 'MultiPolygon',
        'coordinates': [
          [
            [
              [SOUTHWEST_EXTENT_LNG, SOUTHWEST_EXTENT_LAT],
              [-122.513300926011, 37.829992142],
              [NORTHEAST_EXTENT_LNG, NORTHEAST_EXTENT_LAT],
              [-122.361277017, 37.707360625],
              [SOUTHWEST_EXTENT_LNG, SOUTHWEST_EXTENT_LAT]
            ]
          ]
        ]
      }
    }
  ]);
  var SAMPLE_GEOJSON_REQUEST_ERROR = JSON.stringify({
    'message': 'query.soql.no-such-column',
    'errorCode': 'query.soql.no-such-column',
    'data': {
      'data': {
        'column': 'npoint',
        'dataset': 'alpha.90',
        'position': {
          'row': 1,
          'column': 15,
          'line': 'SELECT extent(`npoint`)\n              ^'
        }
      }
    }
  });
  var SAMPLE_GEOJSON_COORDINATES = [[[[-87.7051, 41.8463], [-87.7054, 41.8463]]]];
  var SAMPLE_GEOJSON_REQUEST_RESPONSE = JSON.stringify([
    {
      'geometry': {
        'type': 'MultiPolygon',
        'coordinates': SAMPLE_GEOJSON_COORDINATES
      }
    }
  ]);

  describe('constructor', function() {
    describe('when called with invalid configuration options', function() {

      it('should throw', function() {

        assert.throw(function() {
          var geospaceDataProvider = new GeospaceDataProvider({
            domain: INVALID_DOMAIN,
            datasetUid: VALID_DATASET_UID
          });
        });

        assert.throw(function() {
          var geospaceDataProvider = new GeospaceDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: INVALID_DATASET_UID
          });
        });
      });
    });
  });

  describe('`.getFeatureExtent()`', function() {
    describe('on request error', function() {
      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var geospaceDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing "status", "message" and "soqlError" properties', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct request error status', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct request error message', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct soqlError object', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_EXTENT_REQUEST_ERROR));
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });
    });

    describe('on request success', function() {
      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var geospaceDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing southwest and northeast properties', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              assert.property(data, 'southwest');
              assert.property(data, 'northeast');
              done();
            },
            function(error) {

              // Fail the test since we expected a success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });

      it('should return the expected southwest extent', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              assert.equal(data.southwest[0], SOUTHWEST_EXTENT_LAT);
              assert.equal(data.southwest[1], SOUTHWEST_EXTENT_LNG);
              done();
            },
            function(error) {

              // Fail the test since we expected a success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });

      it('should return the expected northeast extent', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_COLUMN_NAME).
          then(
            function(data) {

              assert.equal(data.northeast[0], NORTHEAST_EXTENT_LAT);
              assert.equal(data.northeast[1], NORTHEAST_EXTENT_LNG);
              done();
            },
            function(error) {

              // Fail the test since we expected a success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });

      describe('ignoreInvalidLatLng true', () => {
        it('should make soql with where clause to ignore invalid geometries', (done) => {
          geospaceDataProvider.
            getFeatureExtent(VALID_COLUMN_NAME, true).
            then(
              function(data) {

                assert.equal(data.northeast[0], NORTHEAST_EXTENT_LAT);
                assert.equal(data.northeast[1], NORTHEAST_EXTENT_LNG);
                done();
              },
              function(error) {

                // Fail the test since we expected a success response.
                assert.isTrue(undefined);
                done();
              }
            ).catch(
              function(e) {

                // Fail the test since we shouldn't be encountering an
                // exception in any case.
                console.log(
                  `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
                );
                assert.isFalse(e);
                done();
              }
            );

          server.respond(
            new RegExp(`where=within_box\\(${VALID_COLUMN_NAME}, -90, -180, 90, 180\\)`),
            [SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]
          );
        });
      });
    });
  });

  describe('`.getShapefile()`', function() {
    describe('on request error', function() {
      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var geospaceDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);

        // Ensure requesting the geojson endpoint
        server.respondWith(/geojson/, [ERROR_STATUS, {}, SAMPLE_GEOJSON_REQUEST_ERROR]);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing "status", "message" and "soqlError" properties', function(done) {

        geospaceDataProvider.
          getShapefile().
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });

      it('should include the correct request error status', function(done) {

        geospaceDataProvider.
          getShapefile().
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });

      it('should include the correct request error message', function(done) {

        geospaceDataProvider.
          getShapefile().
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });

      it('should include the correct soqlError object', function(done) {

        geospaceDataProvider.
          getShapefile().
          then(
            function(data) {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_GEOJSON_REQUEST_ERROR));
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });
    });

    describe('on request success', function() {
      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var geospaceDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);

        // Ensure requesting the geojson endpoint
        server.respondWith(/geojson/, [SUCCESS_STATUS, {}, SAMPLE_GEOJSON_REQUEST_RESPONSE]);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return the parsed GeoJson', function(done) {

        geospaceDataProvider.
          getShapefile().
          then(
            function(data) {

              assert.equal(data.length, 1);
              assert.equal(data[0].geometry.type, 'MultiPolygon');
              assert.deepEqual(data[0].geometry.coordinates, SAMPLE_GEOJSON_COORDINATES);
              done();
            },
            function(error) {

              // Fail the test since we expected a success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });
    });

    describe('when called with an invalid extent argument', function() {
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var fakeXhr;
      var xhrs = [];
      var geospaceDataProvider;

      beforeEach(function() {
        fakeXhr = sinon.useFakeXMLHttpRequest();
        fakeXhr.onCreate = function(xhr) {
          xhrs.push(xhr);
        };
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);
      });

      afterEach(function() {
        fakeXhr.restore();
      });

      it('should fail before making a request', function() {
        var invalidExtentArguments = [
          null,
          false,
          'extent',
          [],
          {},
          { northwest: null, southeast: null },
          { northeast: null, southwest: null },
          { northeast: [], southwest: [] },
          { northeast: [1], southwest: [1] },
          { northeast: [1, 2, 3], southwest: [1, 2, 3] }
        ];

        invalidExtentArguments.forEach(function(invalidExtentArgument) {
          geospaceDataProvider.
            getShapefile(invalidExtentArgument).
            then(
              function(data) {

                // Fail the test since we expected an error response.
                assert.isTrue(undefined);
              },
              function(error) {

                assert.equal(xhrs.length, 0);
                assert.equal(error.status, -1);
                assert.match(error.message, /extent/);
                assert.equal(error.soqlError, null);
              }
            ).catch(
              function(e) {

                // Fail the test since we shouldn't be encountering an
                // exception in any case.
                console.log(
                  `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
                );
                assert.isFalse(e);
              }
            );
        });
      });
    });

    describe('when called with a valid extent argument', function() {
      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var geospaceDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        geospaceDataProvider = new GeospaceDataProvider(geospaceDataProviderOptions);

        // Ensure requesting the geojson endpoint with a MULTIPOLYGON query argument
        server.respondWith(/geojson(.*)MULTIPOLYGON/, [SUCCESS_STATUS, {}, SAMPLE_GEOJSON_REQUEST_RESPONSE]);
        // Still respond to non-MULTIPOLYGON requests so that the test doesn't stall,
        // but fake an error status to trigger the test failure.
        server.respondWith(/geojson$/, [ERROR_STATUS, {}, '{}']);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return the parsed GeoJson', function(done) {

        geospaceDataProvider.
          getShapefile(VALID_EXTENT).
          then(
            function(data) {

              assert.equal(data.length, 1);
              assert.equal(data[0].geometry.type, 'MultiPolygon');
              assert.deepEqual(data[0].geometry.coordinates, SAMPLE_GEOJSON_COORDINATES);
              done();
            },
            function(error) {

              // Fail the test since we expected a success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            function(e) {

              // Fail the test since we shouldn't be encountering an
              // exception in any case.
              console.log(
                `platform-ui/common/spec/visualizations/dataProviders/GeospaceDataProvider.spec.js:${e.message}`
              );
              assert.isFalse(e);
              done();
            }
          );

        server.respond();
      });

      describe('caching behavior', () => {
        it('only sends one request', () => {
          geospaceDataProvider.getShapefile(VALID_EXTENT);
          geospaceDataProvider.getShapefile(VALID_EXTENT);
          geospaceDataProvider.getShapefile(VALID_EXTENT);
          assert.lengthOf(server.requests, 1);
        });
      });

    });
  });
});
