describe('AggregationTourController', function() {
  beforeEach(angular.mock.module('dataCards'));

  var $controller;
  var $rootScope;
  var Mockumentary;
  var ServerConfig;

  beforeEach(inject(function($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');

    $('<div class="aggregation-tour-attachment">').appendTo('body');
  }));

  afterEach(function() {
    $('.aggregation-tour-attachment').remove();
    $('.shepherd-step').remove();
    socrata.utils.getCookie.restore();
  });

  function createAggregationTourController(setFeatureFlag, setCookie) {
    var $scope = $rootScope.$new();
    $scope.page = Mockumentary.createPage();

    ServerConfig.override('enableDataLensAggregationTour', setFeatureFlag);
    sinon.stub(socrata.utils, 'getCookie').returns(setCookie);

    $controller('AggregationTourController', { $scope: $scope });

    $scope.$apply(function() {
      $scope.editMode = true;
    });

    return $scope;
  }

  describe('when the cookie is not set', function() {
    it('should not display a tour upon page customization if the feature flag is disabled', function(done) {
      var $scope = createAggregationTourController(false, false);

      _.defer(function() {
        expect($('.shepherd-step')).to.have.length(0);
        done();
      });
    });

    it('should display a tour upon page customization if the feature flag is enabled', function(done) {
      var $scope = createAggregationTourController(true, false);

      _.defer(function() {
        expect($('.shepherd-step')).to.have.length(1);
        done();
      });
    });
  });

  describe('when the cookie is set', function() {
    it('should not display a tour upon page customization if the feature flag is disabled', function(done) {
      var $scope = createAggregationTourController(false, true);

      _.defer(function() {
        expect($('.shepherd-step')).to.have.length(0);
        done();
      });
    });

    it('should not display a tour upon page customization if the feature flag is enabled', function(done) {
      var $scope = createAggregationTourController(true, true);

      _.defer(function() {
        expect($('.shepherd-step')).to.have.length(0);
        done();
      });
    });
  });
});
