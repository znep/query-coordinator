'use strict';

var $ = require('jquery');

var Analytics = function() {

  var analyticsUrl = '/analytics/add';

  // Default buffer size for
  var queueCapacity = 20;

  // Queue of metrics for consolidation and minimizing outgoing PUT request.
  var queue = [];

  // Whether or not we should send computed metrics to the analytics service backend.
  var serverUploadEnabled = true;

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
   *
   * @param {string} entityName
   * @param {string} metricName
   * @param {string} metricValue
   */
  this.sendMetric = function(entityName, metricName, metricValue) {
    queue.push({entity: entityName, metric: metricName, increment: metricValue});
    if (queue.length >= queueCapacity) {
      this.flushMetrics();
    }
  };

  /**
   * Sends any queued metrics
   */
  this.flushMetrics = function() {
    var analyticsPayload;

    if (serverUploadEnabled) {
      if (queue.length === 0) {
        return;
      }
      // create the batched payload and reset the queue
      analyticsPayload = JSON.stringify({'metrics': queue});
      queue = [];

      $.ajax({
        url: analyticsUrl,
        type: 'post',
        contentType: 'application/text',
        headers: {
          'X-Socrata-Auth': 'unauthenticated'
        },
        data: analyticsPayload,
        dataType: 'json'
      });
    }
  };

  // We want to flush metrics on unload in case we've queued up some metrics and haven't explicitly flushed.
  window.onbeforeunload = this.flushMetrics;
};

module.exports = Analytics;
