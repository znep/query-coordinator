describe('lastUpdated directive', function() {
  var TEST_DATE_VALUE = new Date('Mon, 18 Aug 2014 17:30:21 GMT');
  var TEST_FILTER_VALUE = 'meow!';
  var lastUpdated;
  var fromNowStub;
  var fromNowFilter;
  var scope;
  var element;

  beforeEach(function() {
    module('/angular_templates/dataCards/lastUpdated.html');
    module('socrataCommon.services');
    module('dataCards.directives');
    element = angular.element('<last-updated />');
    fromNowStub = sinon.stub();
    fromNowStub.returns(TEST_FILTER_VALUE);
    fromNowFilter = function() {
      return fromNowStub;
    };
  });

  it('should render with the value of the LastModified observable', function() {
    module('dataCards.services', function($filterProvider, $provide) {
      $provide.value('LastModified', {
        observable: Rx.Observable.returnValue(TEST_DATE_VALUE)
      });
      $filterProvider.register('fromNow', fromNowFilter);
    });
    inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      lastUpdated = $compile(element)(scope);
      scope.$digest();
    });

    expect(lastUpdated.find('.value').text()).to.equal(TEST_FILTER_VALUE);
    expect(fromNowStub.callCount).to.equal(1);
  });

  it('should be invisible if there is no value in the LastModified observable', function() {
    module('dataCards.services', function($filterProvider, $provide) {
      $provide.value('LastModified', {
        observable: Rx.Observable.empty()
      });
      $filterProvider.register('fromNow', fromNowFilter);
    });
    inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      lastUpdated = $compile(element)(scope);
      scope.$digest();
    });
    expect(lastUpdated.find('.invisible').length).to.equal(1);
  })
});
