describe('Analytics service', function() {
  var Analytics, $httpBackend, moment, $rootScope;
  var INITIAL_NAVIGATION_START_TIME = 222;
  var INITIAL_MOMENT_TIME = 1234;
  var INITIAL_TIME_DELTA = INITIAL_MOMENT_TIME - INITIAL_NAVIGATION_START_TIME;
  var DOM_READY_TIME = 4119;
  var fakeClock;

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
  }();

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
    }
  };

  beforeEach(module('socrataCommon.services'));

  beforeEach(function() {
    module(function($provide) {
      $provide.value('moment', mockMomentService);
      $provide.value('$window', mockWindowService);
    });
  });

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    Analytics = $injector.get('Analytics');
  }));


  // *** Fake synchronous timing. ***
  beforeEach(function() {
    fakeClock = sinon.useFakeTimers();
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
               blob.metrics[0].entity === 'domain-intern' &&
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
        expectAnalyticsHttpPost('js-cardsview-page-load-time', fakeRenderEndTime - mockWindowPerformance.timing.navigationStart);

        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime);

        allowPageToSettle();

        flushHttp();
      });

      it('should report page load time immediately on user action', function() {
        var fakeRenderEndTime = _.now();
        expectAnalyticsHttpPost('js-cardsview-page-load-time', fakeRenderEndTime - mockWindowPerformance.timing.navigationStart);

        // Metric is considered complete after at least one render complete is received,
        // and the timeout has passed.
        emitRenderComplete(fakeRenderEndTime);

        emitUserInteraction();

        flushHttp();
      });

      it('should report page load time only once', function() {
        var fakeRenderEndTime = _.now();
        expectAnalyticsHttpPost('js-cardsview-page-load-time', fakeRenderEndTime - mockWindowPerformance.timing.navigationStart);

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

        expectAnalyticsHttpPost('js-cardsview-page-load-time'); // Always emitted.
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

        expectAnalyticsHttpPost('js-cardsview-page-load-time'); // Always emitted.
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

        expectAnalyticsHttpPost('js-cardsview-page-load-time'); // Always emitted.
        expectAnalyticsHttpPost('js-cardsview-my-fake-metric-time', fakeRenderEndTime - INITIAL_MOMENT_TIME);

        Analytics.start('my-fake-metric');
        emitRenderComplete(fakeRenderEndTime);

        emitUserInteraction();
        emitUserInteraction();

        flushHttp();
      });

      it('should NOT report custom metric time if no render complete is received after the call to start()', function() {
        expectAnalyticsHttpPost('js-cardsview-page-load-time'); // Always emitted.

        emitRenderComplete(2); // Should be entirely ignored.
        Analytics.start('my-fake-metric');

        emitUserInteraction(); // Should also be entirely ignored.

        flushHttp();

        // the afterEach hook that verifies the mock $http expectations will throw if unexpected POSTs are sent.
      });
    });

    describe('http request time measurement', function() {
      it('should track the http request time', function() {
        var START_TIME = 1000;
        var END_TIME = 1234;
        Analytics.startHttpRequest('label', START_TIME);
        mockMomentService()._next(END_TIME);
        Analytics.stopHttpRequest('label', START_TIME);
        expectAnalyticsHttpPost('js-cardsview-label-time', END_TIME - START_TIME);
        flushHttp();
      });

      it('should handle multiple in-flight http request timings with same label and different start times', function() {
        var START_TIME_1 = 1000;
        var START_TIME_2 = 1001;
        var END_TIME_1 = 1234;
        var END_TIME_2 = 1432;

        Analytics.startHttpRequest('label', START_TIME_1);
        Analytics.startHttpRequest('label', START_TIME_2);
        mockMomentService()._next(END_TIME_1);
        Analytics.stopHttpRequest('label', START_TIME_2);
        mockMomentService()._next(END_TIME_2);
        Analytics.stopHttpRequest('label', START_TIME_1);
        expectAnalyticsHttpPost('js-cardsview-label-time', END_TIME_1 - START_TIME_2);
        expectAnalyticsHttpPost('js-cardsview-label-time', END_TIME_2 - START_TIME_1);
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
