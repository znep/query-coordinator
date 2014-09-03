describe('Analytics service', function() {
  var Analytics, $httpBackend, moment;
  var INITIAL_NAVIGATION_START_TIME = 222;
  var INITIAL_MOMENT_TIME = 1234;
  var INITIAL_TIME_DELTA = INITIAL_MOMENT_TIME - INITIAL_NAVIGATION_START_TIME;
  var DOM_READY_TIME = 4119;

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

  it('should not report measurements if statsd is not enabled', function() {
    inject(function($injector) {
      $injector.get('ServerConfig').setup({ statsdEnabled: false });
      $httpBackend = $injector.get('$httpBackend');
      Analytics = $injector.get('Analytics');
    });
    Analytics.setNumberOfCards(1);
    Analytics.cardRenderStart('my_id', 123);
    Analytics.cardRenderStop('my_id', 123);
    expect($httpBackend.flush).to.throw(/No pending request/);
  });

  describe('render time measurement', function() {

    beforeEach(function() {
      module(function($provide) {
        $provide.factory('moment', mockMomentService);
      });
      inject(function($injector) {
        $injector.get('ServerConfig').setup({ statsdEnabled: true });
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

    afterEach(httpBackendAfterEach);

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

  describe('http request time measurement', function() {
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

        $injector.get('ServerConfig').setup({ statsdEnabled: true });
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        moment = $injector.get('moment');
        Analytics = $injector.get('Analytics');
      });
    });

    afterEach(httpBackendAfterEach);

    it('should track the http request time', function() {
      var START_TIME = 1000;
      var END_TIME = 1234;
      Analytics.startHttpRequest('label', START_TIME);
      moment()._next(END_TIME);
      Analytics.stopHttpRequest('label', START_TIME);
      $httpBackend.expectPOST('/analytics/add', buildExpectedMetrics('js-cardsview-label-time', END_TIME - START_TIME)).
        respond(200, '');
      $httpBackend.flush();
    });

    it('should handle multiple in-flight http request timings with same label and different start times', function() {
      var START_TIME_1 = 1000;
      var START_TIME_2 = 1001;
      var END_TIME_1 = 1234;
      var END_TIME_2 = 1432;

      Analytics.startHttpRequest('label', START_TIME_1);
      Analytics.startHttpRequest('label', START_TIME_2);
      moment()._next(END_TIME_1);
      Analytics.stopHttpRequest('label', START_TIME_2);
      moment()._next(END_TIME_2);
      Analytics.stopHttpRequest('label', START_TIME_1);
      $httpBackend.expectPOST('/analytics/add', buildExpectedMetrics('js-cardsview-label-time', END_TIME_1 - START_TIME_2)).
        respond(200, '');
      $httpBackend.expectPOST('/analytics/add', buildExpectedMetrics('js-cardsview-label-time', END_TIME_2 - START_TIME_1)).
        respond(200, '');
      $httpBackend.flush();
    });

    it('should not fail if there is a stop with no start', function() {
      var START_TIME = 1000;
      expect(function() {
        Analytics.stopHttpRequest('label', START_TIME);
      }).to.not.throw();
    });
  });

  describe('dom-ready time measurement', function() {
    var $window;
    var mockWindowPerformance = {
      timing: {
        navigationStart: INITIAL_NAVIGATION_START_TIME,
        domComplete: INITIAL_NAVIGATION_START_TIME + DOM_READY_TIME
      }
    };

    afterEach(httpBackendAfterEach);

    it('should listen for dom-ready if the page is not complete', function() {
      var addEventListenerStub = sinon.stub();
      var removeEventListenerStub = sinon.stub();
      module(function($provide) {
        $provide.factory('$window', function() {
          return {
            performance: mockWindowPerformance,
            document: {
              readyState: 'loading',
              addEventListener: addEventListenerStub,
              removeEventListener: removeEventListenerStub
            }
          };
        });
        $provide.factory('moment', mockMomentService);
      });
      inject(function($injector) {
        $injector.get('ServerConfig').setup({ statsdEnabled: true });
        $window = $injector.get('$window');
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        Analytics = $injector.get('Analytics');
      });

      Analytics.measureDomReady();
      expect(addEventListenerStub.calledOnce).to.be.true;
      expect($httpBackend.flush).to.throw(/No pending request/);
      addEventListenerStub.yield();
      expect($httpBackend.flush).to.throw(/No pending request/);
      $window.document.readyState = 'complete';
      addEventListenerStub.yield();
      expect($httpBackend.flush).to.not.throw(/No pending request/);
      expect(removeEventListenerStub.calledOnce).to.be.true;
    });

    it('should track the dom-ready time for a page load', function() {
      module(function($provide) {
        $provide.factory('moment', mockMomentService);
      });
      inject(function($injector) {
        $injector.get('ServerConfig').setup({ statsdEnabled: true });
        $window = $injector.get('$window');
        $window.performance = mockWindowPerformance;

        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        Analytics = $injector.get('Analytics');
      });

      Analytics.measureDomReady();
      var expectedMetrics = buildExpectedMetrics('js-dom-load-time', DOM_READY_TIME);
      $httpBackend.expectPOST('/analytics/add', expectedMetrics).respond(200, '');
      $httpBackend.flush();
    });
  });

  function httpBackendAfterEach() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }

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
