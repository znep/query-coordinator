describe('Socrata-flavored $http service', function() {
  var MOCK_GUID = 'MOCKGUID';
  var TEST_HEADER_KEY = 'X-Test-Header';
  var TEST_HEADER_VALUE = 'TEST';
  var TEST_HEADERS = {};
  TEST_HEADERS[TEST_HEADER_KEY] = TEST_HEADER_VALUE;

  var http, $httpBackend, guid;
  beforeEach(module('socrataCommon.services'));

  beforeEach(function() {
    module(function($provide) {
      var mockGuidService = function() {
        return  MOCK_GUID;
      };
      $provide.value('guid', mockGuidService);
    });
    inject(function($injector) {
      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');
      http = $injector.get('http');
      guid = $injector.get('guid');
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

  it('should have a X-Socrata-RequestID header', function() {
    $httpBackend.whenGET('/test', function(headers) {
      return headers['X-Socrata-RequestID'] === MOCK_GUID;
    }).respond(200, '');
    http({
      url: '/test'
    });
    $httpBackend.flush();
  });

  it('should merge the X-Socrata-RequestID header into existing headers', function() {
    $httpBackend.whenGET('/test', function(headers) {
      return headers['X-Socrata-RequestID'] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
    }).respond(200, '');

    http({
      url: '/test',
      headers: TEST_HEADERS
    });

    $httpBackend.flush();
  });

  it('should throw an error if there is a header similar to X-Socrata-RequestID', function() {

    expect(function() {
      http({
        url: '/test',
        headers: {
          'x-socrata-requestid': 'FOO'
        }
      });
    }).to.throw(/conflicting request id/ig);

  });

  it('should leave existing X-Socrata-RequestID header alone', function() {
    var CUSTOM_HEADER_VALUE = 'my custom header value';

    $httpBackend.whenGET('/test', function(headers) {
      return headers['X-Socrata-RequestID'] === CUSTOM_HEADER_VALUE
    }).respond(200, '');

    http({
      url: '/test',
      headers: {
        'X-Socrata-RequestID': CUSTOM_HEADER_VALUE
      }
    });

    $httpBackend.flush();
  });

  describe('shortcut methods', function() {

    var methodsWithoutData = ['get', 'delete', 'head', 'jsonp'];
    var methodsWithData = ['post', 'put', 'patch'];

    _(methodsWithoutData).forEach(function(method) {
      describe('.{0}()'.format(method), function() {
        it('should have a X-Socrata-RequestID header', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers['X-Socrata-RequestID'] === MOCK_GUID;
          }).respond(200, '');

          http[method]('/test');
          $httpBackend.flush();
        });

        it('should merge the X-Socrata-RequestID header into existing headers', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers['X-Socrata-RequestID'] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
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
        it('should have a X-Socrata-RequestID header', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers['X-Socrata-RequestID'] === MOCK_GUID;
          }).respond(200, '');

          http[method]('/test', {});
          $httpBackend.flush();
        });

        it('should merge the X-Socrata-RequestID header into existing headers', function() {
          $httpBackend.when(method.toUpperCase(), '/test', undefined, function(headers) {
            return headers['X-Socrata-RequestID'] === MOCK_GUID && headers[TEST_HEADER_KEY] === TEST_HEADER_VALUE;
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
