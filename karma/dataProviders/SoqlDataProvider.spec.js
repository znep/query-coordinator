var rewire = require('rewire');
var SoqlDataProvider = rewire('../../src/dataProviders/SoqlDataProvider');

describe('SoqlDataProvider', function() {

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_DATASET_UID = 'test-test';

  var INVALID_DOMAIN = null;
  var INVALID_DATASET_UID = null;

  var QUERY_STRING = 'SELECT testName AS NAME_ALIAS, testValue AS VALUE_ALIAS WHERE testValue > 0 LIMIT 200';

  var ERROR_STATUS = 400;
  var ERROR_MESSAGE = 'Bad request';

  var SUCCESS_STATUS = 200;

  // `.query()` mock data
  var NAME_ALIAS = 'SOQL_DATA_PROVIDER_NAME_ALIAS';
  var VALUE_ALIAS = 'SOQL_DATA_PROVIDER_VALUE_ALIAS';

  var SAMPLE_QUERY_REQUEST_ERROR = JSON.stringify({
    "message": "query.soql.no-such-column",
    "errorCode": "query.soql.no-such-column",
    "data": {
      "data": {
        "column": "ncategory",
        "dataset": "alpha.90",
        "position": {
          "row": 1,
          "column": 8,
          "line": "SELECT `ncategory` as SOQL_DATA_PROVIDER_NAME_ALIAS,COUNT(*) as SOQL_DATA_PROVIDER_VALUE_ALIAS GROUP BY `category` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200\n       ^"
        }
      }
    }
  });

  var SAMPLE_QUERY_REQUEST_RESPONSE = JSON.stringify([
    {
      "SOQL_DATA_PROVIDER_NAME_ALIAS": "Street and Sidewalk Cleaning",
      "SOQL_DATA_PROVIDER_VALUE_ALIAS": "103412"
    },
    {
      "SOQL_DATA_PROVIDER_NAME_ALIAS": "Graffiti Private Property",
      "SOQL_DATA_PROVIDER_VALUE_ALIAS": "31161"
    }
  ]);

  var EXPECTED_QUERY_REQUEST_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_QUERY_REQUEST_ROWS = [
    ["Street and Sidewalk Cleaning", "103412"],
    ["Graffiti Private Property", "31161"]
  ];

  // `.getRows()` mock data
  var SAMPLE_ROW_REQUEST_ERROR = JSON.stringify({
    "message": "query.soql.no-such-column",
    "errorCode": "query.soql.no-such-column",
    "data": {
      "data": {
        "column": "npoint",
        "dataset": "alpha.90",
        "position": {
          "row": 1,
          "column": 38,
          "line": "SELECT * ORDER BY distance_in_meters(`npoint`,'POINT(-122.36434936523439 37.81005519477107)') ASC NULL LAST LIMIT 1 OFFSET 0\n                                     ^"
        }
      }
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

  var SAMPLE_DATASET_METADATA = {
    "columns":
      Object.keys(JSON.parse(SAMPLE_ROW_REQUEST_RESPONSE)[0]).map(function(columnName) {
        return {
          fieldName: columnName
        };
      })
  };

  var SAMPLE_METADATA_ERROR = JSON.stringify({
    "code" : "not_found",
    "error" : true,
    "message" : "Cannot find view with id 56p4-vdcc.jso"
  });

  var EXPECTED_ROW_COUNT = 100;

  var SAMPLE_ROW_COUNT_RESPONSE = JSON.stringify([{count: EXPECTED_ROW_COUNT}]);

  var EXPECTED_ROW_REQUEST_COLUMNS = Object.keys(JSON.parse(SAMPLE_ROW_REQUEST_RESPONSE)[0]);

  var EXPECTED_ROW_REQUEST_ROWS = [
    [
      "Intersection of TREASURE ISLAND RD and",
      "501753",
      "General Requests",
      "2009-12-30T09:13:10.000",
      "Treasure Island/YBI",
      "2009-09-09T06:50:28.000",
      {
        "type": "Point",
        "coordinates": [-122.36357929,37.808938925]
      },
      "tida - tida - request_for_service",
      "tida - tida - request_for_service",
      "PUC - Electric/Power - G - Hold",
      "Voice In",
      "Closed",
      "6",
      "2009-12-30T09:13:10.000"
    ]
  ];

  var server;

  function _respondWithError(payload) {
    server.respond([ERROR_STATUS, { 'Content-Type': 'application/json' }, payload]);
  }

  function _respondWithSuccess(payload) {
    server.respond([SUCCESS_STATUS, { 'Content-Type': 'application/json' }, payload]);
  }

  beforeEach(function() {
    SoqlDataProvider.__set__({
      MetadataProvider: function() {
        this.getDatasetMetadata = _.constant(Promise.resolve(SAMPLE_DATASET_METADATA));
      }
    });
  });

  describe('constructor', function() {

    describe('when called with invalid configuration options', function() {

      it('should throw', function() {

        assert.throw(function() {

          var soqlDataProvider = new SoqlDataProvider({
            domain: INVALID_DOMAIN,
            datasetUid: VALID_DATASET_UID
          });
        });

        assert.throw(function() {

          var soqlDataProvider = new SoqlDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: INVALID_DATASET_UID
          });
        });
      });
    });
  });

  describe('`.query()`', function() {

    describe('on request error', function() {

      var soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var soqlDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(function() {

        server.restore();
      });

      it('should return an object containing "status", "message" and "soqlError" properties', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
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
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct request error status', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
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
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct request error message', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            function(data) {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {

              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct soqlError object', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            function(data) {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {

              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_QUERY_REQUEST_ERROR));
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });
    });

    describe('on request success', function(done) {

      var soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var soqlDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(function() {

        server.restore();
      });

      it('should return an object containing columns and rows', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            function(data) {

              assert.property(data, 'columns');
              assert.property(data, 'rows');
              done();
            },
            function(error) {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });

      it('should return the expected columns', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            function(data) {

              assert.deepEqual(data.columns, EXPECTED_QUERY_REQUEST_COLUMNS);
              done();
            },
            function(error) {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });

      it('should return the expected rows', function(done) {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            function(data) {

              assert.deepEqual(data.rows, EXPECTED_QUERY_REQUEST_ROWS);
              done();
            },
            function(error) {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });
    });
  });

  describe('`.getRows()`', function() {

    describe('on request error', function() {

      var soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var soqlDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(function() {

        server.restore();
      });

      it('should return an object containing "status", "message" and "soqlError" properties', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error status', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error message', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {
              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct soqlError object', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            function(error) {
              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_ROW_REQUEST_ERROR));
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });
    });

    describe('on request success', function(done) {

      var soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      var soqlDataProvider;

      beforeEach(function() {

        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(function() {

        server.restore();
      });

      it('should return an object containing columns and rows', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {

              assert.property(data, 'columns');
              assert.property(data, 'rows');
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });

      it('should return the expected columns', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {

              assert.deepEqual(data.columns, EXPECTED_ROW_REQUEST_COLUMNS);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });

      it('should return the expected rows', function(done) {

        soqlDataProvider.
          getRows(QUERY_STRING).
          then(
            function(data) {

              assert.deepEqual(data.rows, EXPECTED_ROW_REQUEST_ROWS);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });
    });
  });

  describe('getRowCount()', function() {
    var soqlDataProvider;
    var soqlDataProviderOptions = {
      domain: VALID_DOMAIN,
      datasetUid: VALID_DATASET_UID
    };

    beforeEach(function() {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
    });

    afterEach(function() {
      server.restore();
    });

    describe('on request error', function() {
      it('should return an object containing "status", "message" and "soqlError" properties', function(done) {
        soqlDataProvider.getRowCount().then(
          done,
          function(error) {
            assert.property(error, 'status');
            assert.equal(error.status, ERROR_STATUS);
            done();
          }
        ).catch(done);

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });
    });

    describe('on request success', function() {
      it('should return an Array containing an Object with key `count`.', function(done) {
        soqlDataProvider.getRowCount().then(
          function(count) {
            assert.equal(count, EXPECTED_ROW_COUNT);
            done();
          },
          done
        ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_COUNT_RESPONSE);
      });
    });
  });
});
