var MetadataProvider = require('../../src/dataProviders/MetadataProvider');

describe('MetadataProvider', function() {

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_DATASET_UID = 'test-test';

  var INVALID_DOMAIN = null;
  var INVALID_DATASET_UID = null;

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

  var SAMPLE_ROW_REQUEST_RESPONSE = JSON.stringify([
    {
      "address": "Intersection of TREASURE ISLAND RD and",
      "case_id": "501753",
      "category": "General Requests",
      "closed": "2009-12-30T09:13:10.000",
      "neighborhood": "Treasure Island/YBI",
      "opened": "2009-09-09T06:50:28.000",
      "point": {
        "type": "Point",
        "coordinates": [-122.36357929,37.808938925]
      },
      "request_details": "tida - tida - request_for_service",
      "request_type": "tida - tida - request_for_service",
      "responsible_agency": "PUC - Electric/Power - G - Hold",
      "source": "Voice In",
      "status": "Closed",
      "supervisor_district": "6",
      "updated": "2009-12-30T09:13:10.000"
    },
  ]);

  var SAMPLE_DATASET_METADATA = window.testData.CHICAGO_CRIMES_DATASET_METADATA;

  var SAMPLE_METADATA_ERROR = JSON.stringify({
    "code" : "not_found",
    "error" : true,
    "message" : "Cannot find view with id 56p4-vdcc.jso"
  });

  var server;
  var metadataProviderOptions = {
    domain: VALID_DOMAIN,
    datasetUid: VALID_DATASET_UID
  };
  var metadataProvider;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    metadataProvider = new MetadataProvider(metadataProviderOptions);
  });

  afterEach(function() {
    server.restore();
  });

  describe('constructor', function() {

    it('should throw with invalid configuration values', function() {

      assert.throw(function() {

        var metadataProvider = new MetadataProvider({
          domain: INVALID_DOMAIN,
          datasetUid: VALID_DATASET_UID
        });
      });

      assert.throw(function() {

        var metadataProvider = new MetadataProvider({
          domain: VALID_DOMAIN,
          datasetUid: INVALID_DATASET_UID
        });
      });
    });
  });

  describe('`.getPhidippidesAugmentedDatasetMetadata`', function() {

    describe('on request error', function() {

      it('should return an object containing "code" and "message" properties', function(done) {

        metadataProvider.
          getPhidippidesAugmentedDatasetMetadata().
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
          getPhidippidesAugmentedDatasetMetadata().
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
          getPhidippidesAugmentedDatasetMetadata().
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

      it('should return the expected metadata', function(done) {

        metadataProvider.
          getPhidippidesAugmentedDatasetMetadata().
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

  describe('getDatasetMetadata()', function() {
    describe('on request error', function() {
      it('should return an Object containing "code", "error", and "message"', function(done) {
        metadataProvider.getDatasetMetadata().then(
          done,
          function(error) {
            assert.property(error, 'status');
            assert.equal(error.status, ERROR_STATUS);
            done();
          }
        ).catch(done);

        server.respond([ERROR_STATUS, {}, SAMPLE_METADATA_ERROR]);
      });
    });

    describe('on request success', function() {
      it('should return an Object of metadata', function(done) {
        metadataProvider.getDatasetMetadata().then(
          function(data) {
            assert.isObject(data);
            assert.property(data, 'columns');
            assert.isArray(data.columns);
            done();
          },
          done
        ).catch(done);

        server.respond([SUCCESS_STATUS, {'Content-Type': 'application/json'}, JSON.stringify(SAMPLE_DATASET_METADATA)]);
      });
    });
  });

  describe('isSubcolumn()', function() {
    it('returns true when there is a suffix', function() {
      var sampleDatasetMetadataWithExtraSimilarlyNamedColumns = _.cloneDeep(SAMPLE_DATASET_METADATA);

      sampleDatasetMetadataWithExtraSimilarlyNamedColumns.columns.push({
        "id" : _.uniqueId(),
        "name" : "Location 1",
        "dataTypeName" : "point",
        "fieldName" : "location_1",
        "position" : d3.max(_.pluck(SAMPLE_DATASET_METADATA.columns, 'position')) + 1,
        "renderTypeName" : "point",
        "tableColumnId" : _.uniqueId(),
        "format" : { }
      });

      sampleDatasetMetadataWithExtraSimilarlyNamedColumns.columns.push({
        "id" : _.uniqueId(),
        "name" : "Location 1 (city)",
        "dataTypeName" : "point",
        "fieldName" : "location_1_city",
        "position" : d3.max(_.pluck(SAMPLE_DATASET_METADATA.columns, 'position')) + 2,
        "renderTypeName" : "point",
        "tableColumnId" : _.uniqueId(),
        "format" : { }
      });

      assert.isFalse(metadataProvider.isSubcolumn(
        'location_1',
        sampleDatasetMetadataWithExtraSimilarlyNamedColumns
      ));

      assert.isTrue(metadataProvider.isSubcolumn(
        'location_1_city',
        sampleDatasetMetadataWithExtraSimilarlyNamedColumns
      ));
    });

    it('flags subcolumns when there is not a suffix', function() {
      assert.isFalse(metadataProvider.isSubcolumn('location', SAMPLE_DATASET_METADATA));
      assert.isTrue(metadataProvider.isSubcolumn('location_city', SAMPLE_DATASET_METADATA));
    });
  });
});
