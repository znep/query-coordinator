describe('AssetRevisionKey http interceptor', function() {
  'use strict';

  var $http;
  var $httpBackend;
  var AssetRevisionKey;
  var testHelpers;
  var $rootScope;
  var CardDataService;

  beforeEach(function() {
    module('socrataCommon.services');
    module(function($provide) {
      $provide.constant('ServerConfig', {
        setup: _.noop,
        override: _.noop,
        get: _.constant('ASSETREVISIONKEY')
      });
    });
    module('test');
    module('dataCards');
    module('dataCards.directives');
    module('dataCards.services');
    inject(function($injector) {
      AssetRevisionKey = $injector.get('AssetRevisionKey');
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');
      $http = $injector.get('$http');
      testHelpers = $injector.get('testHelpers');
      CardDataService = $injector.get('CardDataService');
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should be present', function() {
    expect(AssetRevisionKey).to.be.an('object');
    expect(AssetRevisionKey.request).to.be.a('function');
  });

  it('should intercept http requests', function() {
    var requestSpy = sinon.spy(AssetRevisionKey, 'request');
    $http.get('/test');
    $httpBackend.whenGET('/test').respond(200);
    $httpBackend.flush();
    expect(requestSpy.calledOnce).to.equal(true);
  });

  it('should apply the assetRevisionKey to angular_templates requests', function() {
    var regex = new RegExp('/angular_templates/dataCards/spinner\\.html\\?assetRevisionKey=ASSETREVISIONKEY$');
    $httpBackend.expectGET(regex).respond('');
    testHelpers.TestDom.compileAndAppend('<spinner></spinner>', $rootScope);
    $httpBackend.flush();
  });

  it('should not apply the assetRevisionKey to other requests', function() {
    var regex = new RegExp('assetRevisionKey=ASSETREVISIONKEY');
    $httpBackend.expectGET({
      // NOTE: Our current version of Angular does not support a function for the
      // expectation test, but it does allow an object that responds to a 'test' method
      // (i.e. a regex).  I'm exploiting that fact here
      test: function(url) {
        return !regex.test(url);
      }
    }).respond([{count_0: 5}]);
    CardDataService.getRowCount('dead-beef');
    $httpBackend.flush();
  });

});
