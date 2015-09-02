describe('socrata.visualizations.GeospaceDataProvider', function() {

  'use strict';

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_FOUR_BY_FOUR = 'test-test';
  var VALID_FIELD_NAME = 'point';

  var INVALID_DOMAIN = null;
  var INVALID_FOUR_BY_FOUR = null;
  var INVALID_FIELD_NAME = 'npoint';

  var ERROR_STATUS = 400;
  var ERROR_MESSAGE = 'Bad request';

  var SUCCESS_STATUS = 200;

  var SAMPLE_EXTENT_REQUEST_ERROR = JSON.stringify({
    "message": "query.soql.no-such-column",
    "errorCode": "query.soql.no-such-column",
    "data": {
      "data": {
        "column": "npoint",
        "dataset": "alpha.90",
        "position": {
          "row": 1,
          "column": 15,
          "line": "SELECT extent(`npoint`)\n              ^"
        }
      }
    }
  });

  var SOUTHWEST_EXTENT_LNG = -122.513300926011;
  var SOUTHWEST_EXTENT_LAT = 37.707360625;

  var NORTHEAST_EXTENT_LNG = -122.361277017;
  var NORTHEAST_EXTENT_LAT = 37.829992142;

  var SAMPLE_EXTENT_REQUEST_RESPONSE = JSON.stringify([
    {
      "extent_point": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [SOUTHWEST_EXTENT_LNG,SOUTHWEST_EXTENT_LAT],
              [-122.513300926011,37.829992142],
              [NORTHEAST_EXTENT_LNG,NORTHEAST_EXTENT_LAT],
              [-122.361277017,37.707360625],
              [SOUTHWEST_EXTENT_LNG,SOUTHWEST_EXTENT_LAT]
            ]
          ]
        ]
      }
    }
  ]);

  var GeospaceDataProvider = window.socrata.visualizations.GeospaceDataProvider;

  describe('constructor', function() {

    describe('when called with invalid configuration options', function() {

      it('should throw', function() {

        assert.throw(function() {

          var geospaceDataProvider = new GeospaceDataProvider({
            domain: INVALID_DOMAIN,
            fourByFour: VALID_FOUR_BY_FOUR
          });
        });

        assert.throw(function() {

          var geospaceDataProvider = new GeospaceDataProvider({
            domain: VALID_DOMAIN,
            fourByFour: INVALID_FOUR_BY_FOUR
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
        fourByFour: VALID_FOUR_BY_FOUR
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
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct request error status', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct request error message', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });

      it('should include the correct soqlError object', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_EXTENT_REQUEST_ERROR]);
      });
    });

    describe('on request success', function(done) {

      var server;
      var geospaceDataProviderOptions = {
        domain: VALID_DOMAIN,
        fourByFour: VALID_FOUR_BY_FOUR
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
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });

      it('should return the expected southwest extent', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });

      it('should return the expected northeast extent', function(done) {

        geospaceDataProvider.
          getFeatureExtent(VALID_FIELD_NAME).
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
              console.log(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([SUCCESS_STATUS, {}, SAMPLE_EXTENT_REQUEST_RESPONSE]);
      });
    });
  });
});
