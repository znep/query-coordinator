describe('Analytics service', function() {
  var Analytics, $httpBackend, $rootScope;

  beforeEach(module('socrataCommon.services'));
  beforeEach(inject(function($injector) {
    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');
    // Get hold of a scope (i.e. the root scope)
    $rootScope = $injector.get('$rootScope');
    // The $controller service is used to create instances of controllers
    Analytics = $injector.get('Analytics');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('Rendering card count', function() {

    it('should be able to get the number of cards that will render', function() {
      expect(Analytics.getNumberOfCards).to.exist;
      expect(Analytics.getNumberOfCards).to.be.a('function');
      var numCards = Analytics.getNumberOfCards();
      expect(numCards).to.equal(0);
    });

    it('should be able to increment the number of cards that will render', function() {
      expect(Analytics.incrementNumberOfCards).to.exist;
      expect(Analytics.incrementNumberOfCards).to.be.a('function');
      Analytics.incrementNumberOfCards();
      expect(Analytics.getNumberOfCards()).to.equal(1);
      Analytics.incrementNumberOfCards();
      expect(Analytics.getNumberOfCards()).to.equal(2);
    });

    it('should be able to set the number of cards that will render', function() {
      expect(Analytics.setNumberOfCards).to.exist;
      expect(Analytics.setNumberOfCards).to.be.a('function');
      Analytics.setNumberOfCards(10);
      expect(Analytics.getNumberOfCards()).to.equal(10);
      Analytics.setNumberOfCards(0);
      expect(Analytics.getNumberOfCards()).to.equal(0);
    });

  });

  describe('Render time measurement', function() {

    it('should track page load initially', function() {
      Analytics.setNumberOfCards(1);
      Analytics.cardRenderStart('my_id', 123);
      var measurement = Analytics.getCurrentMeasurement();
      Analytics.cardRenderStop('my_id', 123);

      var expectedMetrics = buildExpectedMetrics('js-cardsview-page-load-time', measurement.cardsInFlight[0].stopTime - measurement.startTime);
      $httpBackend.expectPOST('/analytics/add', expectedMetrics).respond(200, '');
      $httpBackend.flush();
    });

    it('should track according to the label on subsequent calls', function() {
      Analytics.setNumberOfCards(1);
      Analytics.cardRenderStart('my_id', 123);
      Analytics.cardRenderStop('my_id', 123);
      $httpBackend.expectPOST('/analytics/add').respond(200, '');
      Analytics.start('my-label');
      Analytics.cardRenderStart('my_id', 123);
      var measurement = Analytics.getCurrentMeasurement();
      Analytics.cardRenderStop('my_id', 123);
      var expectedMetrics = buildExpectedMetrics('js-cardsview-my-label-time', measurement.cardsInFlight[0].stopTime - measurement.startTime);
      $httpBackend.expectPOST('/analytics/add', expectedMetrics).respond(200, '');
      $httpBackend.flush();
    });

    it('should track multiple rendering cards', function() {
      var allCardsStopped = false;

      $httpBackend.whenPOST('/analytics/add', function() {
        expect(allCardsStopped).to.equal(true, 'All cards should be stopped');
        return allCardsStopped;
      }).respond(200, '');

      Analytics.setNumberOfCards(2);
      Analytics.cardRenderStart('my_card_1', 1);
      Analytics.cardRenderStart('my_card_2', 2);
      Analytics.cardRenderStop('my_card_2', 2);

      expect($httpBackend.flush).to.throw(/No pending request/);
      expect(Analytics.getCurrentMeasurement).to.exist;
      Analytics.cardRenderStop('my_card_1', 1);
      allCardsStopped = true;
      $httpBackend.flush();
    });

  });

  function buildExpectedMetrics(metricValue, incrementValue) {
    return {
      "metrics": [
        {
          "entity": "domain-intern",
          "metric": metricValue,
          "increment": incrementValue
        }
      ]
    };
  }
});