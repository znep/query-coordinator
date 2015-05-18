(function() {
  'use strict';

  // Additional changes...

  var analyticsUrl = '/analytics/add';
  var defaultEntity = 'domain-intern';
  var jsCardsViewBaseName = 'js-cardsview-{0}-time';

  /**
   * Analytics service
   *
   * @constructor
   */
  function Analytics($log, $window, http, ServerConfig, Assert, $rootScope, AngularRxExtensions) {
    AngularRxExtensions.install($rootScope);

    // *** Set up utility functions. ***

    // We consider the renderer settled/done/idle if it hasn't
    // done anything for this long. We use this to decide when
    // to look at the page event history to calculate page
    // load times. Note that this is pre-empted if the user
    // interacts with the page.
    this.idleTimeForRendererToBeConsideredSettled = 15000;

    // Default buffer size for
    var queueCapacity = 20;

    // Queue of metrics for consolidation and minimizing outgoing PUT request.
    var queue = [];

    // true for IE9+, Chrome, Firefox (as of 8/12/14)
    var hasPerformanceTiming = _.isDefined($window.performance) && _.isDefined($window.performance.timing);

    // Whether or not we should send computed metrics to the analytics service backend.
    var serverUploadEnabled = true;

    var currentTime = function() {
      return Date.now();
    };

    var navigationStartTime = function() {
      var navigationStartTime;
      if (hasPerformanceTiming) {
        navigationStartTime = $window.performance.timing.navigationStart || $window.performance.timing.fetchStart || undefined;
      }
      return navigationStartTime;
    };

    // Set up some inputs to the analytics.
    var renderCompleteEvents = $rootScope.$eventToObservable('render:complete');
    var rendererSettledEvents = renderCompleteEvents.debounce(this.idleTimeForRendererToBeConsideredSettled, Rx.Scheduler.timeout);
    var userInteractedEvents = $rootScope.$eventToObservable('user-interacted');

    // Consider the page settled if the renderer goes idle OR the user does something to the page.
    var pageSettledEvents = Rx.Observable.merge(
      rendererSettledEvents,
      userInteractedEvents
    );

    // For the pageLoaded metric, we want to see when the last render:complete event was at the
    // time the page settled for the first time.
    var lastRenderEndBeforePageLoadSettled = renderCompleteEvents.sample(pageSettledEvents.take(1));
    lastRenderEndBeforePageLoadSettled.subscribe(function finalizeMeasurement(lastRenderCompleteEvent) {
      var lastCardRenderedAt = _.get(lastRenderCompleteEvent, 'additionalArguments[0].timestamp');
      var timeDelta = lastCardRenderedAt - navigationStartTime();
      if (_.isNaN(timeDelta)) {
        $log.debug('timeDelta was NaN');
      }
      // Enable if we want new ux page to count toward the total count of all page views
      if (ServerConfig.get('enableNewuxPageViewCount')) {
        sendMetric('domain', 'js-page-view', 1);
      }
      sendMetric('domain', 'js-page-view-newux', 1);
      sendPerformanceMetric(jsCardsViewBaseName.format('page-load'), timeDelta);

      // final flush of all known metrics
      flushMetrics();
    });

    /**
     * Sends a metric data point for the domComplete timing provided by the browser
     * Only supported if the browser supports window.performance.timing.
     */
    this.measureDomReady = function() {
      if (!hasPerformanceTiming) { return; }

      var finalizeMeasurement = function() {
        var navStartTime = navigationStartTime();
        var domCompleteTime = $window.performance.timing.domComplete;
        sendPerformanceMetric('js-dom-load-time', domCompleteTime - navStartTime);
      };

      var onReadyStateChange = function() {
        if ($window.document.readyState === 'complete') {
          $window.document.removeEventListener('readystatechange', onReadyStateChange);
          finalizeMeasurement();
        }
      };

      if ($window.document.readyState === 'complete') {
        finalizeMeasurement();
      } else {
        $window.document.addEventListener('readystatechange', onReadyStateChange);
      }
    };

    /**
     * Given a label for a measurement, sets the start time for the measurement
     * The measurement ends when the page is settled (see above).
     *
     * @param {string} label
     */
    this.start = function(label) {
      var startTime = currentTime();
      renderCompleteEvents.sample(pageSettledEvents.take(1)).subscribe(function(event) {
        var timeDelta = _.get(event, 'additionalArguments[0].timestamp') - startTime;

        if (_.isNaN(timeDelta)) {
          $log.debug('timeDelta was NaN');
        }

        sendPerformanceMetric(jsCardsViewBaseName.format(label), timeDelta);
      });
    };

    var httpRequests = [];

    this.startHttpRequest = function(label, timestamp) {
      httpRequests.push({
        label: label,
        startTime: timestamp
      });
    };

    this.stopHttpRequest = function(label, timestamp) {
      var stopTime = currentTime();
      var records = _.remove(httpRequests, function(element) {
        return element.label === label && element.startTime === timestamp;
      });
      if (records.length > 0) {
        var record = records[0];
        var timeDelta = stopTime - record.startTime;
        if (_.isNaN(timeDelta)) {
          $log.debug('timeDelta was NaN');
        }
        sendPerformanceMetric(jsCardsViewBaseName.format(label), timeDelta);
      }
    };

    // Controls whether or not to send computed metrics up to
    // the backend. Defaults to enabled.
    this.setServerUploadEnabled = function(isEnabled) {
      serverUploadEnabled = isEnabled;
    };

    /**
     * Set the size of the metrics buffer.
     *
     * @param size Desired size of the metrics buffer.
     */
    this.setMetricsQueueCapacity = function(size) {
      if (size > 0) {
        queueCapacity = size;
      }
    };

    /**
     * Posts an analytics metric to the analytics endpoint
     * Analytics endpoint performs checking to determine if it is a valid metric.
     */
    function sendPerformanceMetric(metricName, metricValue) {
      sendMetric(defaultEntity, metricName, metricValue)
    }

    function sendMetric(entityName, metricName, metricValue) {
      queue.push({entity: entityName, metric: metricName, increment: metricValue});
      if (queue.length >= queueCapacity) {
          flushMetrics();
      }
    }

    function flushMetrics() {
      var analyticsPayload;
      var analyticsConfig;

      if (serverUploadEnabled) {
        if (queue.length == 0) return;
        // create the batched payload and reset the queue
        analyticsPayload = JSON.stringify({'metrics': queue});
        queue = [];

        analyticsConfig = {
          'headers': {
            'X-Socrata-Auth': 'unauthenticated',
            'Content-Type': 'application/text'
          },
          'contentType': 'application/json',
          'dataType': 'json',
          'requester': {}
        };

        http.post(analyticsUrl, analyticsPayload, analyticsConfig);

      }
    }

  }

  angular.
    module('socrataCommon.services').
    service('Analytics', Analytics);

})();
