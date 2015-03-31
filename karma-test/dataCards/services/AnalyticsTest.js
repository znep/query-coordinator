describe('Analytics service', function() {
  'use strict';

  var Analytics, $httpBackend, moment, $rootScope;
  var INITIAL_NAVIGATION_START_TIME = 222;
  var INITIAL_MOMENT_TIME = 1234;
  var INITIAL_TIME_DELTA = INITIAL_MOMENT_TIME - INITIAL_NAVIGATION_START_TIME;
  var DOM_READY_TIME = 4119;
  var fakeClock;
  var ServerConfig;

  var mockWindowPerformance = {
    timing: {
      navigationStart: INITIAL_NAVIGATION_START_TIME,
      domComplete: INITIAL_NAVIGATION_START_TIME + DOM_READY_TIME
    }
  };
  var mockWindowService = {
    performance: mockWindowPerformance,
    document: {
      readyState: 'loading',
      addEventListener: function(){},
      removeEventListener: function(){}
    },
    navigator: {
      userAgent: 'other'
    }
  };

  beforeEach(module('socrataCommon.services'));

  beforeEach(function() {
    module(function($provide) {
      $provide.value('$window', mockWindowService);
    });
  });

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    ServerConfig = $injector.get('ServerConfig');
    Analytics = $injector.get('Analytics');
    // Test with a queue size of one so we can identify at a greater granularity
    // which sendMetric calls are potentially missing or duplicated
    Analytics.setMetricsQueueCapacity(1);
  }));


  // *** Fake synchronous timing. ***
  beforeEach(function() {
    fakeClock = sinon.useFakeTimers(INITIAL_MOMENT_TIME);
  });

  afterEach(function() {
    fakeClock.reset();
    fakeClock.restore();
    fakeClock = undefined;
  });

  // Analytics has a timeout to let the page settle.
  // Synchronously force that timeout to complete.
  function allowPageToSettle() {
    fakeClock.tick(Analytics.idleTimeForRendererToBeConsideredSettled * 2);
  }

  // *** Helpers to verify calls to /analytics/add. ***
  function expectAnalyticsHttpPost(optionalMetricName, optionalMetricValue) {
    if (optionalMetricName || optionalMetricValue) {
      $httpBackend.expectPOST('/analytics/add', function verifier(blob) {
        var blob = JSON.parse(blob);
        return blob.metrics &&
               blob.metrics.length === 1 &&
               (_.isUndefined(optionalMetricName) || blob.metrics[0].metric === optionalMetricName) &&
               (_.isUndefined(optionalMetricValue) || blob.metrics[0].increment === optionalMetricValue);
      }).respond(200);
    } else {
      $httpBackend.expectPOST('/analytics/add').respond(200);
    }
  }

  function flushHttp() {
    $httpBackend.flush();
  }

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // *** Some helpers to emit scope events analytics cares about. ***
  function emitRenderComplete(optionalRenderTime) {
    $rootScope.$emit('render:complete', { source: _.uniqueId(), timestamp: optionalRenderTime || _.now() });
  }

  function emitUserInteraction() {
    $rootScope.$emit('user-interacted');
  }

  /**
   * Metrics that are (almost given a configuration) always sent.  Notice the order of the expected
   * metrics are the same as the order they are sent.  See analytics.js
   */
  function expectDefaultMetrics(optionalCardsPageLoadTime) {
    if (ServerConfig.get('enable_newux_page_view_count')) {
      expectAnalyticsHttpPost('js-page-view', 1); // Emitted if configured
    }
    // Always emitted.
    expectAnalyticsHttpPost('js-page-view-newux', 1);
    if (_.isDefined(optionalCardsPageLoadTime)) {
      expectAnalyticsHttpPost('js-cardsview-page-load-time', optionalCardsPageLoadTime);
    } else {
      expectAnalyticsHttpPost('js-cardsview-page-load-time');
    }
  }

  // *** Actual tests. ***
  describe('with upload disabled', function() {
    it('should not report measurements', function() {
      Analytics.setServerUploadEnabled(false);
      Analytics.start('some_fake_metric');

      // Metric is considered complete after at least one render complete is received,
      // and the timeout has passed.
      emitRenderComplete();

      allowPageToSettle();

      expect($httpBackend.flush).to.throw(/No pending request/);
    });
  });

  describe('with server upload enabled', function() {
    describe('page-load metric', function() {
      it('should not report page load time immediately on render complete', function() {
        emitRenderComplete();

        expect($httpBackend.flush).to.throw(/No pending request/);
      });

      it('should report page load time on natural settling', function() {
        var fakeRenderEndTime = _.now();
        expectDefaultMetrics();

        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime);

        allowPageToSettle();

        flushHttp();
      });

      it('should report page load time immediately on user action', function() {
        var fakeRenderEndTime = _.now();
        expectDefaultMetrics(fakeRenderEndTime - mockWindowPerformance.timing.navigationStart);

        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime);

        emitUserInteraction();

        flushHttp();
      });

      it('should report page load time only once', function() {
        var fakeRenderEndTime = _.now();
        expectDefaultMetrics(fakeRenderEndTime - mockWindowPerformance.timing.navigationStart);

        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime);

        emitUserInteraction();
        emitUserInteraction();

        allowPageToSettle();

        flushHttp();
      });

      it('should NOT report page load time if no render complete is received', function() {
        emitUserInteraction(); // Should be entirely ignored.
        allowPageToSettle(); // Should also be entirely ignored.

        expect($httpBackend.flush).to.throw(/No pending request/);
      });
    });

    describe('custom metric', function() {
      it('should not report custom metric time immediately on render complete', function() {
        Analytics.start('my-fake-metric');
        emitRenderComplete();

        expect($httpBackend.flush).to.throw(/No pending request/);
      });

      it('should report custom metric time on natural settling', function() {
        var fakeRenderEndTime1 = INITIAL_MOMENT_TIME - 1000;
        var fakeRenderEndTime2 = INITIAL_MOMENT_TIME + 1000;
        expectDefaultMetrics();
        expectAnalyticsHttpPost('js-cardsview-my-fake-metric-time', fakeRenderEndTime2 - INITIAL_MOMENT_TIME);

        emitRenderComplete(fakeRenderEndTime1);
        Analytics.start('my-fake-metric');
        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime2);

        allowPageToSettle();

        flushHttp();
      });

      it('should report custom metric time immediately on user action', function() {
        var fakeRenderEndTime1 = INITIAL_MOMENT_TIME - 1000;
        var fakeRenderEndTime2 = INITIAL_MOMENT_TIME + 1000;
        expectDefaultMetrics();
        expectAnalyticsHttpPost('js-cardsview-my-fake-metric-time', fakeRenderEndTime2 - INITIAL_MOMENT_TIME);

        emitRenderComplete(fakeRenderEndTime1);
        Analytics.start('my-fake-metric');
        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime2);

        emitUserInteraction();

        flushHttp();
      });

      it('should report custom metric time only once', function() {
        var fakeRenderEndTime = INITIAL_MOMENT_TIME + 100;
        expectDefaultMetrics();
        expectAnalyticsHttpPost('js-cardsview-my-fake-metric-time', fakeRenderEndTime - INITIAL_MOMENT_TIME);

        Analytics.start('my-fake-metric');
        emitRenderComplete(fakeRenderEndTime);

        emitUserInteraction();
        emitUserInteraction();

        flushHttp();
      });

      it('should NOT report custom metric time if no render complete is received after the call to start()', function() {
        expectDefaultMetrics();

        emitRenderComplete(2); // Should be entirely ignored.
        Analytics.start('my-fake-metric');

        emitUserInteraction(); // Should also be entirely ignored.

        flushHttp();

        // the afterEach hook that verifies the mock $http expectations will throw if unexpected POSTs are sent.
      });
    });

    describe('http request time measurement', function() {
      it('should track the http request time', function() {
        var DURATION_OF_REQUEST = 1000;

        Analytics.startHttpRequest('label', INITIAL_MOMENT_TIME);
        fakeClock.tick(DURATION_OF_REQUEST);
        Analytics.stopHttpRequest('label', INITIAL_MOMENT_TIME);

        expectAnalyticsHttpPost('js-cardsview-label-time', DURATION_OF_REQUEST);
        flushHttp();
      });

      it('should handle multiple in-flight http request timings with same label and different start times', function() {
        var DURATION_OF_REQUEST_1 = 1000;
        var DURATION_OF_REQUEST_2 = 500;
        var SECOND_REQUEST_START_OFFSET = 200;

        Analytics.startHttpRequest('label', INITIAL_MOMENT_TIME);
        Analytics.startHttpRequest('label', INITIAL_MOMENT_TIME + SECOND_REQUEST_START_OFFSET);

        fakeClock.tick(DURATION_OF_REQUEST_1);

        Analytics.stopHttpRequest('label', INITIAL_MOMENT_TIME + SECOND_REQUEST_START_OFFSET);
        Analytics.stopHttpRequest('label', INITIAL_MOMENT_TIME);

        expectAnalyticsHttpPost('js-cardsview-label-time', DURATION_OF_REQUEST_1 - SECOND_REQUEST_START_OFFSET);
        expectAnalyticsHttpPost('js-cardsview-label-time', DURATION_OF_REQUEST_1);
        flushHttp();
      });

      it('should not fail if there is a stop with no start', function() {
        var START_TIME = 1000;
        expect(function() {
          Analytics.stopHttpRequest('label', START_TIME);
        }).to.not.throw();
      });
    });

    describe('dom-ready time measurement', function() {
      it('should listen for dom-ready if the page is not complete', function() {
        var addEventListenerStub = sinon.stub(mockWindowService.document, 'addEventListener');
        var removeEventListenerStub = sinon.stub(mockWindowService.document, 'removeEventListener');

        Analytics.measureDomReady();
        expect(addEventListenerStub.calledOnce).to.be.true;
        expect($httpBackend.flush).to.throw(/No pending request/);
        addEventListenerStub.yield();
        expect($httpBackend.flush).to.throw(/No pending request/);
        mockWindowService.document.readyState = 'complete';
        addEventListenerStub.yield();
        expect($httpBackend.flush).to.not.throw(/No pending request/);
        expect(removeEventListenerStub.calledOnce).to.be.true;
      });

      it('should track the dom-ready time for a page load', function() {
        Analytics.measureDomReady();
        expectAnalyticsHttpPost('js-dom-load-time', DOM_READY_TIME);
        flushHttp();
      });
    });
  });
});
