(function() {
  'use strict';

  var analyticsUrl = '/analytics/add';
  var entity = 'domain-intern';
  var baseMetricName = 'js-cardsview-{0}-time';

  // Special-case operations that do not affect all cards
  var numExpectedCards = {
    'table-column-sort': 1
  };

  /**
   * Analytics service
   *
   * @constructor
   */
  function Analytics($log, $window, http, moment, ServerConfig) {

    var statsdEnabled = ServerConfig.get('statsdEnabled') || false;

    // true for IE9+, Chrome, Firefox (as of 8/12/14)
    var hasPerformanceTiming = _.isDefined($window.performance) && _.isDefined($window.performance.timing);

    var currentTime = function() {
      return moment().valueOf();
    };

    var navigationStartTime = function() {
      var navigationStartTime;
      if (hasPerformanceTiming) {
        navigationStartTime = $window.performance.timing.navigationStart || $window.performance.timing.fetchStart || undefined;
      }
      return navigationStartTime;
    };

    var currentMeasurement = createMeasurement('page-load', navigationStartTime());
    var numCards = 0;

    /**
     * Sends a metric data point for the domComplete timing provided by the browser
     *
     */
    this.measureDomReady = function() {
      var finalizeMeasurement = function() {
        var navStartTime = navigationStartTime();
        var domCompleteTime = $window.performance.timing.domComplete;
        if (hasPerformanceTiming && navStartTime && domCompleteTime) {
          sendMetric('js-dom-load-time', domCompleteTime - navStartTime);
        }
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
     * Sets the number of cards on the page, used in validating that all cards have "reported in"
     *
     * @param {number} numberOfCards
     */
    this.setNumberOfCards = function(numberOfCards) {
      numCards = numberOfCards;
    };

    this.getNumberOfCards = function() {
      return numCards;
    };

    this.incrementNumberOfCards = function() {
      numCards += 1;
    };

    /**
     * Given a label for a measurement, sets the start time for the measurement
     *
     * @param {string} label
     */
    this.start = function(label) {
      if (_.isPresent(currentMeasurement)) {
        $log.warn('Attempted to start measurement for label {0}, but already started for label {1}'.format(label, currentMeasurement.label));
      } else {
        currentMeasurement = createMeasurement(label);
      }
    };

    /**
     * Register a card rendering start time with the current measurement
     *
     * @param {string} id - Unique ID for a card (ex. {cardType}_{scope.$id})
     * @param {number} [timestamp] - Timestamp to correlate measurement records
     */
    this.cardRenderStart = function(id, timestamp) {
      if (_.isUndefined(timestamp)) {
        timestamp = currentTime();
      }
      if (_.isPresent(currentMeasurement)) {
        var cardData = {
          id: id,
          startTime: timestamp
        };
        var existingCardInFlight = _.find(currentMeasurement.cardsInFlight, cardData);
        if (_.isDefined(existingCardInFlight)) {
          return;
        }
        currentMeasurement.cardsInFlight.push(cardData);
      }
    };

    /**
     * Record a card rendering stop time with the current measurement
     *
     * @param {string} id - Unique ID for a card (ex. {cardType}_{scope.$id})
     * @param {number} timestamp - Timestamp to correlate measurement records
     */
    this.cardRenderStop = function(id, timestamp) {
      if (_.isPresent(currentMeasurement)) {
        var cardsInFlight = currentMeasurement.cardsInFlight;
        var cardRecord = _.findWhere(cardsInFlight, function(cardInFlight) {
          return cardInFlight.id === id && cardInFlight.startTime === timestamp;
        });
        if (_.isPresent(cardRecord)) {
          cardRecord.stopTime = currentTime();
        }
        currentMeasurement.cardIds[id] = true;
        checkCardsInFlight();
      }
    };

    /**
     * Check if all cards have completed rendering, finalize the measurement if complete
     *
     * @private
     */
    function checkCardsInFlight() {
      var cardIdsSeen = _(currentMeasurement.cardIds).size();
      var cardsExpected = numExpectedCards[currentMeasurement.label];
      if (_.isUndefined(cardsExpected)) {
        cardsExpected = numCards;
      }

      if (cardIdsSeen !== cardsExpected) {
        return;
      }

      var noCardsInFlight = _.every(currentMeasurement.cardsInFlight, function(cardInFlight) {
        return _.isDefined(cardInFlight.stopTime);
      });
      if (noCardsInFlight) {
        finalizeMeasurement();
      }
    }

    /**
     * Stops the in-progress measurement and calculates the time it took for the "event" to complete, by taking the
     * largest stop time from the card rendering measurements
     *
     * @private
     */
    function finalizeMeasurement() {
      if (_.isEmpty(currentMeasurement) || _.isEmpty(currentMeasurement.cardsInFlight)) {
        return;
      }

      var finalRenderedCard = _.max(currentMeasurement.cardsInFlight, 'stopTime');
      var timeDelta = finalRenderedCard.stopTime - currentMeasurement.startTime;
      if (_.isNaN(timeDelta)) {
        $log.debug('timeDelta was NaN');
      }
      sendMetric(baseMetricName.format(currentMeasurement.label), timeDelta);
      currentMeasurement = null;
    }

    /**
     * Helper function to scaffold a measurement object
     *
     * @private
     * @param {string} label
     * @param {number} [startTime]
     * @returns {{label: string, startTime: number, cardIds: {}, cardsInFlight: []}}
     */
    function createMeasurement(label, startTime) {
      startTime = startTime || currentTime();

      return {
        label: label,
        startTime: startTime,
        cardIds: {},
        cardsInFlight: []
      }
    }

    /**
     * Posts an analytics metric to the analytics endpoint
     * Analytics endpoint performs checking to determine if it is a valid metric
     *
     * @todo - Queue requests and flush when the queue is full and on page unload
     *
     * @private
     * @param metricName
     * @param metricValue
     */
    function sendMetric(metricName, metricValue) {
      if (statsdEnabled) {
        http({
          method: 'post',
          url: analyticsUrl,
          data: JSON.stringify({
            metrics: [
              {
                entity: entity,
                metric: metricName,
                increment: metricValue
              }
            ]
          }),
          headers: {
            'X-Socrata-Auth': 'unauthenticated',
            'Content-Type': 'application/text'
          },
          contentType: 'application/json',
          dataType: 'json'
        });
      }
    }

  }

  angular.
    module('socrataCommon.services').
    service('Analytics', Analytics);

})();
