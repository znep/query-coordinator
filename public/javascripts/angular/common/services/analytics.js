(function() {
  'use strict';

  var analyticsUrl = '/analytics/add';
  var entity = 'domain-intern';
  var baseMetricName = 'js-cardsview-{0}-time';

  // Special-case operations that do not affect all cards
  var numExpectedCards = {
    'table-column-sort': 1
  };

  // true for IE9+, Chrome, Firefox (as of 8/12/14)
  var hasPerformanceTiming = _.isDefined(window.performance);

  var currentTime = function() {
    return new Date().getTime();
  };

  var navigationStartTime = function() {
    var navigationStartTime;
    if (hasPerformanceTiming && _.isDefined(window.performance.timing)) {
      navigationStartTime = window.performance.timing.navigationStart || window.performance.timing.fetchStart || undefined;
    }
    return navigationStartTime;
  };

  /**
   * Analytics service
   *
   * @constructor
   */
  function Analytics($http, $log) {

    var currentMeasurement = createMeasurement('page-load', navigationStartTime());
    var numCards = 0;

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

    this.getCurrentMeasurement = function() {
      return currentMeasurement;
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
        currentMeasurement.cardsInFlight.push({
          id: id,
          startTime: timestamp
        });
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
      if (_.isEmpty(startTime)) {
        startTime = currentTime();
      }
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
     * @private
     * @param metricName
     * @param metricValue
     */
    function sendMetric(metricName, metricValue) {
      $http({
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

  angular.
    module('socrataCommon.services').
    service('Analytics', Analytics);

})();