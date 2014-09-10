describe('LastModified http interceptor', function() {
  var LAST_MODIFIED_HEADER_KEY = 'X-SODA2-Truth-Last-Modified';
  var TEST_VALUE = 'Mon, 18 Aug 2014 17:30:21 GMT';
  var EXPECTED_TIME_SINCE = '12 days ago';
  var VALID_URL = '/api/id/four-four.json?foo=bar';
  var INVALID_URL = '/resource/four-four.geojson';
  var $http, $httpBackend;
  var LastModified;

  beforeEach(function() {
    module('dataCards.services', function($provide) {
      $provide.value('moment', function() {
        return {
          fromNow: function() {
            return  EXPECTED_TIME_SINCE;
          },
          isValid: function() {
            return true;
          }
        };
      })
    });
    module('dataCards.services');
    inject(function($injector) {
      LastModified = $injector.get('LastModified');
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');
      $http = $injector.get('$http');
    });
  });

  it('should be present', function() {
    expect(LastModified).to.be.an('object');
    expect(LastModified.response).to.be.a('function');
  });

  it('should intercept http responses', function() {
    var responseSpy = sinon.spy(LastModified, 'response');
    $http.get('/test');
    $httpBackend.whenGET('/test').respond(200);
    $httpBackend.flush();
    expect(responseSpy.calledOnce).to.be.true;
  });

  it('should push values to the observable if the {0} header is present'.format(LAST_MODIFIED_HEADER_KEY), function() {
    var expected = [new Date(TEST_VALUE)];
    var actual = [];
    var observable = LastModified.observable;
    observable.subscribe(function(val) { actual.push(val); });
    $http.get(VALID_URL);
    var headers = {};
    headers[LAST_MODIFIED_HEADER_KEY] = TEST_VALUE;
    $httpBackend.whenGET(VALID_URL).respond(200, null, headers);
    $httpBackend.flush();
    expect(actual).to.eql(expected);
  });

  describe('url regex', function() {
    it('should allow SODA URLs', function() {
      expect(LastModified.regex.test(VALID_URL)).to.be.true;
    });

    it('should not allow geospace URLs', function() {
      expect(LastModified.regex.test(INVALID_URL)).to.be.false;
    });
  });

  describe('toDate', function() {
    it('should turn a string into a date', function() {
      expect(LastModified.toDate(TEST_VALUE)).to.eql(new Date(TEST_VALUE));
    });
  })

});
