describe('socrata.visualizations.SoqlDataProvider', function() {

  'use strict';

  var VALID_DOMAIN = 'localhost:9443';
  var VALID_FOUR_BY_FOUR = 'test-test';
  var VALID_SUCCESS_CALLBACK = function() {};
  var VALID_ERROR_CALLBACK = function() {};

  var INVALID_DOMAIN = null;
  var INVALID_FOUR_BY_FOUR = null;
  var INVALID_SUCCESS_CALLBACK = null;
  var INVALID_ERROR_CALLBACK = null;

  var QUERY_STRING = 'SELECT testName AS NAME_ALIAS, testValue AS VALUE_ALIAS WHERE testValue > 0 LIMIT 200';
  var NAME_ALIAS = 'NAME_ALIAS';
  var VALUE_ALIAS = 'VALUE_ALIAS';

  var ERROR_CODE = 400;
  var ERROR_MESSAGE = 'Bad request';
  var ERROR_SOQL_ERROR = {
    message: 'soql error message'
  };

  var EXPECTED_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  var EXPECTED_ROWS = [
    ['TEST NAME 1', 'TEST VALUE 1'],
    ['TEST NAME 2', 'TEST VALUE 2']
  ];

  var SUCCESS_RESPONSE = [
    { 'name': EXPECTED_ROWS[0][0], 'value': EXPECTED_ROWS[0][1] },
    { 'name': EXPECTED_ROWS[1][0], 'value': EXPECTED_ROWS[1][1] }
  ];

  var SoqlDataProvider = window.socrata.visualizations.SoqlDataProvider;

  describe('constructor', function() {

    it('should throw with invalid configuration values', function() {

      assert.throw(function() {

        var soqlDataProvider = new SoqlDataProvider({
          domain: INVALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: VALID_ERROR_CALLBACK
        });
      });

      assert.throw(function() {

        var soqlDataProvider = new SoqlDataProvider({
          domain: VALID_DOMAIN,
          fourByFour: INVALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: VALID_ERROR_CALLBACK
        });
      });

      assert.throw(function() {

        var soqlDataProvider = new SoqlDataProvider({
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: INVALID_SUCCESS_CALLBACK,
          error: VALID_ERROR_CALLBACK
        });
      });

      assert.throw(function() {

        var soqlDataProvider = new SoqlDataProvider({
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: INVALID_ERROR_CALLBACK
        });
      });
    });
  });

  describe('`.query()`', function() {

    describe('on request error', function() {

      var server;
      var response;

      beforeEach(function() {

        server = sinon.fakeServer.create();

        response = JSON.stringify({
          code: ERROR_CODE,
          message: ERROR_MESSAGE,
          soqlError: JSON.stringify(ERROR_SOQL_ERROR)
        });

        server.respondWith(response);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing "code", "message" and "soqlError" properties', function() {

        function testErrorCallback(error) {
          expect(error).to.have.property('code');
          expect(error).to.have.property('message');
          expect(error).to.have.property('soqlError');
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct request error code', function() {

        function testErrorCallback(error) {
          expect(error.code).to.equal(ERROR_CODE);
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct request error message', function() {

        function testErrorCallback(error) {
          expect(error.message).to.equal(ERROR_MESSAGE);
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct soqlError object', function() {

        function testErrorCallback(error) {
          expect(error.soqlError).to.deep.equal(ERROR_SOQL_ERROR);
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: VALID_SUCCESS_CALLBACK,
          error: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });
    });

    describe('on request success', function() {

      var server;
      var response;

      beforeEach(function() {

        server = sinon.fakeServer.create();

        response = JSON.stringify(SUCCESS_RESPONSE);

        server.respondWith(response);
      });

      afterEach(function() {
        server.restore();
      });

      it('should return an object containing columns and rows', function() {

        function testSuccessCallback(data) {
          expect(data).to.have.property('columns');
          expect(data).to.have.property('rows');
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: testSuccessCallback,
          error: VALID_ERROR_CALLBACK
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should return the expected columns', function() {

        function testSuccessCallback(data) {
          expect(data.columns).to.equal([NAME_ALIAS, VALUE_ALIAS]);
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: testSuccessCallback,
          error: VALID_ERROR_CALLBACK
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should return the expected rows', function() {

        function testSuccessCallback(data) {
          expect(data.columns).to.equal(EXPECTED_ROWS);
        }

        var options = {
          domain: VALID_DOMAIN,
          fourByFour: VALID_FOUR_BY_FOUR,
          success: testSuccessCallback,
          error: VALID_ERROR_CALLBACK
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });
    });
  });
});
