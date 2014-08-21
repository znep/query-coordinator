describe('Analytics service', function() {
  var Analytics, $httpBackend, moment;
  var INITIAL_NAVIGATION_START_TIME = 222;
  var INITIAL_MOMENT_TIME = 1234;
  var INITIAL_TIME_DELTA = INITIAL_MOMENT_TIME - INITIAL_NAVIGATION_START_TIME;

  var mockMomentService = function() {
    var nextValue = INITIAL_MOMENT_TIME;
    return function() {
      return {
        valueOf: function() {
          return nextValue;
        },
        _next: function(value) {
          nextValue = value;
        }
      };
    };
  };

  beforeEach(module('socrataCommon.services'));

  describe('rendering card count', function() {

    beforeEach(function() {
      inject(function($injector) {
        Analytics = $injector.get('Analytics');
      });
    });

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

  describe('render time measurement', function() {

    beforeEach(function() {
      module(function($provide) {
        $provide.factory('moment', mockMomentService);
      });
      inject(function($injector) {
        var $window = $injector.get('$window');
        $window.performance = {
          timing: {
            navigationStart: INITIAL_NAVIGATION_START_TIME
          }
        };

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        moment = $injector.get('moment');
        Analytics = $injector.get('Analytics');
      });
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should track page load initially', function() {
      Analytics.setNumberOfCards(1);
      Analytics.cardRenderStart('my_id', 123);
      Analytics.cardRenderStop('my_id', 123);

      var expectedMetrics = buildExpectedMetrics('js-cardsview-page-load-time', INITIAL_TIME_DELTA);
      $httpBackend.expectPOST('/analytics/add', expectedMetrics).respond(200, '');
      $httpBackend.flush();
    });

    it('should track according to the label on subsequent calls', function() {
      var SECOND_METRIC_START_TIME = 3000;
      var SECOND_METRIC_STOP_TIME = 3678;

      Analytics.setNumberOfCards(1);
      Analytics.cardRenderStart('my_id', 123);
      Analytics.cardRenderStop('my_id', 123);
      $httpBackend.expectPOST('/analytics/add').respond(200, '');

      moment()._next(SECOND_METRIC_START_TIME);
      Analytics.start('my-label');
      Analytics.cardRenderStart('my_id', 123);
      moment()._next(SECOND_METRIC_STOP_TIME);
      Analytics.cardRenderStop('my_id', 123);
      var expectedMetrics = buildExpectedMetrics('js-cardsview-my-label-time', SECOND_METRIC_STOP_TIME - SECOND_METRIC_START_TIME);
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
      Analytics.cardRenderStop('my_card_1', 1);
      allCardsStopped = true;
      $httpBackend.flush();
    });


    it('should not record more than one unique card ID / start time combination', function() {
      Analytics.setNumberOfCards(1);
      Analytics.cardRenderStart('my_id', 123);
      Analytics.cardRenderStart('my_id', 123);
      Analytics.cardRenderStop('my_id', 123);
      $httpBackend.expectPOST('/analytics/add').respond(200, '');
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
