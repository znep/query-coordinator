describe('socrata.visualizations.SoqlDataProvider', function() {

  'use strict';

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
          fourbyFour: 'test-test',
          successCallback: function() {},
          errorCallback: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct request error code', function() {

        function testErrorCallback(error) {
          expect(error.code).to.equal(ERROR_CODE);
        }

        var options = {
          fourbyFour: 'test-test',
          successCallback: function() {},
          errorCallback: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct request error message', function() {

        function testErrorCallback(error) {
          expect(error.message).to.equal(ERROR_MESSAGE);
        }

        var options = {
          fourbyFour: 'test-test',
          successCallback: function() {},
          errorCallback: testErrorCallback
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should include the correct soqlError object', function() {

        function testErrorCallback(error) {
          expect(error.soqlError).to.deep.equal(ERROR_SOQL_ERROR);
        }

        var options = {
          fourbyFour: 'test-test',
          successCallback: function() {},
          errorCallback: testErrorCallback
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

        response = JSON.stringify({
          columns: EXPECTED_COLUMNS,
          rows: EXPECTED_ROWS
        });

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
          fourbyFour: 'test-test',
          successCallback: testSuccessCallback,
          errorCallback: function() {}
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should return the expected columns', function() {

        function testSuccessCallback(data) {
          expect(data.columns).to.equal([NAME_ALIAS, VALUE_ALIAS]);
        }

        var options = {
          fourbyFour: 'test-test',
          successCallback: testSuccessCallback,
          errorCallback: function() {}
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });

      it('should return the expected rows', function() {

        function testSuccessCallback(data) {
          expect(data.columns).to.equal(EXPECTED_ROWS);
        }

        var options = {
          fourbyFour: 'test-test',
          successCallback: testSuccessCallback,
          errorCallback: function() {}
        };

        var soqlDataProvider = new SoqlDataProvider(options);

        soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
      });
    });
  });
});
