describe('socrata.visualizations.MetadataProvider', function() {

  'use strict';

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_FOUR_BY_FOUR = 'test-test';

  var INVALID_DOMAIN = null;
  var INVALID_FOUR_BY_FOUR = null;

  var ERROR_STATUS = 400;
  var ERROR_MESSAGE = 'Bad request';

  var SUCCESS_STATUS = 200;

  var SAMPLE_DATASET_METADATA_REQUEST_ERROR = '';

  var SAMPLE_DATASET_METADATA_REQUEST_RESPONSE = JSON.stringify({
    "name": "Case Data from San Francisco 311",
    "updatedAt": "2014-08-22T22:36:10.000Z",
    "defaultPage": "cs5s-apnb",
    "description": "Cases created since 7/1/2008 with location information",
    "domain": "dataspace.demo.socrata.com",
    "rowDisplayUnit": "Case",
    "locale": "en_US",
    "id": "r6t9-rak2",
    "columns": {
      "request_details": {
        "name": "request details",
        "fred": "text",
        "description": "Cases created since 7/1/2008 with location information",
        "physicalDatatype": "text",
        "position": 9,
        "hideInTable": false,
        "format": {},
        "dataTypeName": "text",
        "renderTypeName": "text"
      },
      "category": {
        "name": "category",
        "fred": "category",
        "description": "",
        "physicalDatatype": "text",
        "position": 7,
        "hideInTable": false,
        "format": {},
        "dataTypeName": "text",
        "renderTypeName": "text"
      }
    },
    "ownerId": "8ibz-n25n",
    "permissions": {
      "isPublic": true,
      "rights": [
        "read"
      ]
    }
  });

  var MetadataProvider = window.socrata.visualizations.MetadataProvider;

  describe('constructor', function() {

    it('should throw with invalid configuration values', function() {

      assert.throw(function() {

        var metadataProvider = new MetadataProvider({
          domain: INVALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR
        });
      });

      assert.throw(function() {

        var metadataProvider = new MetadataProvider({
          domain: VALID_DOMAIN,
          fourByFour: INVALID_FOUR_BY_FOUR
        });
      });
    });
  });

  describe('`.getDatasetMetadata()`', function() {

    describe('on request error', function() {

      var server;
      var metadataProviderOptions = {
        domain: VALID_DOMAIN,
        fourByFour: VALID_FOUR_BY_FOUR
      };
      var metadataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        metadataProvider = new MetadataProvider(metadataProviderOptions);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing "code" and "message" properties', function(done) {

        metadataProvider.
          getDatasetMetadata().
          then(
            function() {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            function(error) {

              assert.property(error, 'status');
              assert.property(error, 'message');
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

        server.respond([ERROR_STATUS, {}, SAMPLE_DATASET_METADATA_REQUEST_ERROR]);
      });

      it('should include the correct request error code', function(done) {

        metadataProvider.
          getDatasetMetadata().
          then(
            function() {

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

        server.respond([ERROR_STATUS, {}, SAMPLE_DATASET_METADATA_REQUEST_ERROR]);
      });

      it('should include the correct request error message', function(done) {

        metadataProvider.
          getDatasetMetadata().
          then(
            function() {

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
              console.error(e.message);
              assert.isFalse(e);
              done();
            }
          );

        server.respond([ERROR_STATUS, {}, SAMPLE_DATASET_METADATA_REQUEST_ERROR]);
      });
    });

    describe('on request success', function(done) {

      var server;
      var metadataProviderOptions = {
        domain: VALID_DOMAIN,
        fourByFour: VALID_FOUR_BY_FOUR
      };
      var metadataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        metadataProvider = new MetadataProvider(metadataProviderOptions);
      });

      afterEach(function() {

        server.restore();
      });

      it('should return the expected metadata', function(done) {

        metadataProvider.
          getDatasetMetadata().
          then(
            function(data) {

              assert.deepEqual(data, JSON.parse(SAMPLE_DATASET_METADATA_REQUEST_RESPONSE));
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

        server.respond([SUCCESS_STATUS, {}, SAMPLE_DATASET_METADATA_REQUEST_RESPONSE]);
      });
    });
  });
});
