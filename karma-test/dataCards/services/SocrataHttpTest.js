describe('Socrata-flavored $http service', function() {
  var HEADER_KEY = 'X-Socrata-RequestId';
  var MOCK_GUID = 'MOCKGUID';
  var TEST_HEADER_KEY = 'X-Test-Header';
  var TEST_HEADER_VALUE = 'TEST';
  var TEST_HEADERS = {};
  TEST_HEADERS[TEST_HEADER_KEY] = TEST_HEADER_VALUE;

  var INITIAL_TIME = 1337;
  var fakeClock;
  var http, $httpBackend, $rootScope;

  beforeEach(function() {
    fakeClock = sinon.useFakeTimers(INITIAL_TIME);

    module('socrataCommon.services', function($provide) {
      $provide.value('RequestId', {
        generate: function() {
          return MOCK_GUID;
        }
      });
    });
    module('socrataCommon.services');
    inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      // Set up the mock http service responses
      $httpBackend = $injector.get('$httpBackend');
      http = $injector.get('http');
    });
  });

  afterEach(function() {
    fakeClock.restore();
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

  describe('csrf', function() {
    it('configures requests to use our csrf token/header', function() {
      var config = {url: '/test'};
      http(config);
      expect(config.xsrfHeaderName).to.equal('X-CSRF-Token');
      expect(config.xsrfCookieName).to.equal('socrata-csrf-token');

      $httpBackend.whenGET('/test').respond(200, '');
      expect($httpBackend.flush).to.not.throw();
    });
  });

  describe('requester tagging', function() {
    var REQUESTER_NAME = 'my-requester';
    var requester;
    var requesterStub;

    var makeRequest = function() {
      requesterStub = sinon.stub();
      requesterStub.returns(REQUESTER_NAME);
      requester = {
        requesterLabel: requesterStub
      };
      var requestConfig = {
        url: '/test',
        requester: requester
      };
      http(requestConfig);
    };

    it('should interrogate a "requester" if one is provided in the requestConfig for its "requesterLabel"', function() {
      makeRequest();

      expect(requesterStub.calledOnce).to.be.true;
      var spyCall = requesterStub.getCall(0);
      expect(spyCall.thisValue).to.equal(requester);
      $httpBackend.whenGET('/test').respond(200, '');
      expect($httpBackend.flush).to.not.throw();
    });

    it('should ignore a "requester" if it does not implement the "requesterLabel" interface', function() {
      expect(function() {
        http({
          url: '/test',
          requester: {}
        });
      }).to.not.throw();
      $httpBackend.whenGET('/test').respond(200, '');
      expect($httpBackend.flush).to.not.throw();
    });

    it('should emit start/stop events with the "httpRequester" information', function() {
      var httpStartEventHandlerStub = sinon.stub();
      var httpStopEventHandlerStub = sinon.stub();
      $rootScope.$on('http:start', httpStartEventHandlerStub);
      $rootScope.$on('http:stop', httpStopEventHandlerStub);

      makeRequest();

      $httpBackend.whenGET('/test').respond(200, '');
      $httpBackend.flush();

      var startCall = httpStartEventHandlerStub.getCall(0);
      var startCallArgs = startCall.args[1];
      expect(startCallArgs.requester).to.equal(requester);
      expect(startCallArgs.requesterLabel).to.equal(REQUESTER_NAME);
      var stopCall = httpStopEventHandlerStub.getCall(0);
      var stopCallArgs = stopCall.args[1];
      expect(stopCallArgs.requester).to.equal(requester);
      expect(stopCallArgs.requesterLabel).to.equal(REQUESTER_NAME);
    });

  });

  describe('http:* events', function() {
    var httpStartEventHandlerStub;
    var httpStopEventHandlerStub;
    var httpErrorEventHandlerStub;

    beforeEach(function() {
      httpStartEventHandlerStub = sinon.stub();
      httpStopEventHandlerStub = sinon.stub();
      httpErrorEventHandlerStub = sinon.stub();
      $rootScope.$on('http:start', httpStartEventHandlerStub);
      $rootScope.$on('http:stop', httpStopEventHandlerStub);
      $rootScope.$on('http:error', httpErrorEventHandlerStub);
      http({ url: '/test' });
    });

    it('should emit an "http:start" and "http:stop" event', function() {
      $httpBackend.whenGET('/test').respond(200, '');
      expect(httpStartEventHandlerStub.calledOnce).to.be.true;
      expect(httpStopEventHandlerStub.called).to.be.false;
      expect(httpErrorEventHandlerStub.called).to.be.false;
      $httpBackend.flush();
      expect(httpStartEventHandlerStub.calledOnce).to.be.true;
      expect(httpStopEventHandlerStub.calledOnce).to.be.true;
      expect(httpErrorEventHandlerStub.called).to.be.false;
    });

    it('should emit an "http:error" if the http request errors', function() {
      $httpBackend.whenGET('/test').respond(500, '');
      expect(httpErrorEventHandlerStub.called).to.be.false;
      expect(httpStopEventHandlerStub.called).to.be.false;
      $httpBackend.flush();
      expect(httpErrorEventHandlerStub.calledOnce).to.be.true;
      expect(httpStopEventHandlerStub.called).to.be.false;
    });

    it('should include timing data in the start/stop events', function() {
      var STOP_TIME = 2000;
      $httpBackend.whenGET('/test').respond(200, '');
      var startEventCall = httpStartEventHandlerStub.getCall(0);
      var startEventMetadata = startEventCall.args[1];
      expect(startEventMetadata).to.exist.and.to.be.an('object');
      expect(startEventMetadata.startTime).to.exist.and.to.equal(INITIAL_TIME);
      fakeClock.tick(STOP_TIME - INITIAL_TIME);
      $httpBackend.flush();
      var stopEventCall = httpStopEventHandlerStub.getCall(0);
      var stopEventMetadata = stopEventCall.args[1];
      expect(stopEventMetadata).to.exist.and.to.be.an('object');
      expect(stopEventMetadata.startTime).to.exist.and.to.equal(INITIAL_TIME);
      expect(stopEventMetadata.stopTime).to.exist.and.to.equal(STOP_TIME);
    });

    it('should include timing data in the error events', function() {
      var ERROR_TIME = 2321;
      $httpBackend.whenGET('/test').respond(500, '');
      fakeClock.tick(ERROR_TIME - INITIAL_TIME);
      $httpBackend.flush();
      var errorEventCall = httpErrorEventHandlerStub.getCall(0);
      var errorEventMetadata = errorEventCall.args[1];
      expect(errorEventMetadata).to.exist.and.to.be.an('object');
      expect(errorEventMetadata.startTime).to.exist.and.to.equal(INITIAL_TIME);
      expect(errorEventMetadata.stopTime).to.exist.and.to.equal(ERROR_TIME);
    });

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
