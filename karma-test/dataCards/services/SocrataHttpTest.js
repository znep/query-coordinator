describe('Socrata-flavored $http service', function() {
  var HEADER_KEY = 'X-Socrata-RequestId';
  var MOCK_GUID = 'MOCKGUID';
  var TEST_HEADER_KEY = 'X-Test-Header';
  var TEST_HEADER_VALUE = 'TEST';
  var TEST_HEADERS = {};
  TEST_HEADERS[TEST_HEADER_KEY] = TEST_HEADER_VALUE;

  var http, $httpBackend;

  beforeEach(function() {
    module('socrataCommon.services', function($provide) {
      $provide.value('RequestId', {
        generate: function() {
          return MOCK_GUID;
        }
      });
    });
    module('socrataCommon.services');
    inject(function($injector) {
      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');
      http = $injector.get('http');
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should return the promise from the wrapped $http service', function() {
    $httpBackend.whenGET('/test').respond(200, '');
    var promise = http({
      url: '/test'
    });
    expect(promise.then).to.exist.and.be.a('function');
    $httpBackend.flush();
  });

  it('should have a X-Socrata-RequestId header', function() {
    $httpBackend.whenGET('/test', function(headers) {
      return headers[HEADER_KEY] === MOCK_GUID;
    }).respond(200, '');
    http({
      url: '/test'
    });
    $httpBackend.flush();
  });

  it('should merge the X-Socrata-RequestId header into existing headers', function() {
    $httpBackend.whenGET('/test', function(headers) {
      return headers[HEADER_KEY] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
    }).respond(200, '');

    http({
      url: '/test',
      headers: TEST_HEADERS
    });

    $httpBackend.flush();
  });

  it('should throw an error if there is a header similar to X-Socrata-RequestId', function() {

    expect(function() {
      http({
        url: '/test',
        headers: {
          'x-SoCrAtA-ReQuEsTiD': 'Foo'
        }
      });
    }).to.throw(/conflicting request id/ig);

  });

  it('should leave existing X-Socrata-RequestId header alone', function() {
    var CUSTOM_HEADER_VALUE = 'my custom header value';
    var headers = {};
    headers[HEADER_KEY] = CUSTOM_HEADER_VALUE;

    $httpBackend.whenGET('/test', function(headers) {
      return headers[HEADER_KEY] === CUSTOM_HEADER_VALUE
    }).respond(200, '');

    http({
      url: '/test',
      headers: headers
    });

    $httpBackend.flush();
  });

  describe('shortcut methods', function() {

    var methodsWithoutData = ['get', 'delete', 'head', 'jsonp'];
    var methodsWithData = ['post', 'put', 'patch'];

    _(methodsWithoutData).forEach(function(method) {
      describe('.{0}()'.format(method), function() {
        it('should have a X-Socrata-RequestId header', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers[HEADER_KEY] === MOCK_GUID;
          }).respond(200, '');

          http[method]('/test');
          $httpBackend.flush();
        });

        it('should merge the X-Socrata-RequestId header into existing headers', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers[HEADER_KEY] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
          }).respond(200, '');

          http[method]('/test', {
            headers: TEST_HEADERS
          });
          $httpBackend.flush();
        });
      });
    });

    _(methodsWithData).forEach(function(method) {
      describe('.{0}()'.format(method), function() {
        it('should have a X-Socrata-RequestId header', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers[HEADER_KEY] === MOCK_GUID;
          }).respond(200, '');

          http[method]('/test', {});
          $httpBackend.flush();
        });

        it('should merge the X-Socrata-RequestId header into existing headers', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers[HEADER_KEY] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
          }).respond(200, '');

          http[method]('/test', {}, {
            headers: TEST_HEADERS
          });
          $httpBackend.flush();
        });
      });
    });

  });

});
