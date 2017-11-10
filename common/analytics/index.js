import _ from 'lodash';
import $ from 'jquery';

import { defaultHeaders } from 'common/http';

export const Analytics = function() {

  // Queue of metrics for consolidation and minimizing outgoing POST request.
  const queue = [];

  // Whether or not we should send computed metrics to the analytics service.
  let serverUploadEnabled = true;

  // Default buffer size for
  let queueCapacity = 20;

  /**
   * Controls whether or not to send computed metrics up to the backend.
   *
   * @param isEnabled True or false
   */
  this.setServerUploadEnabled = (isEnabled) => {
    if (_.isBoolean(isEnabled)) {
      serverUploadEnabled = isEnabled;
    }
  };

  /**
   * Set the size of the metrics buffer.
   *
   * @param size Positive number
   */
  this.setMetricsQueueCapacity = (size) => {
    if (size > 0) {
      queueCapacity = size;
    }
  };

  /**
   * Posts an analytics metric to the analytics endpoint
   * Analytics endpoint performs checking to determine if it is a valid metric.
   *
   * @param entityName The entity type, e.g. 'domain'
   * @param metricName The name of the metric, e.g. 'js-page-view'
   * @param metricValue The value of the metric, e.g. 1
   */
  this.sendMetric = (entityName, metricName, metricValue) => {
    queue.push({ entity: entityName, metric: metricName, increment: metricValue });
    if (queue.length >= queueCapacity) {
      this.flushMetrics();
    }
  };

  /**
   * Sends any queued metrics
   * @param async Whether to send the metrics asynchronously (default: true).
   */
  this.flushMetrics = (async = true) => {
    if (!serverUploadEnabled) {
      return;
    }

    if (queue.length === 0) {
      return;
    }

    if (!_.isBoolean(async)) {
      return;
    }

    // create the batched payload and reset the queue
    const analyticsUrl = '/analytics/add';
    const analyticsPayload = JSON.stringify({ metrics: queue });
    queue.splice(0);

    $.post({
      url: analyticsUrl,
      async: async,
      contentType: 'application/text',
      data: analyticsPayload,
      dataType: 'json',
      headers: {
        'X-Socrata-Auth': 'unauthenticated'
      }
    });
  };

  /**
   * Registers a page view at the Core endpoint, which is necessary in order to
   * track stuff like referrers.
   *
   * @param uid The 4x4 of the view
   */
  this.registerPageView = _.memoize((uid) => {
    if (!/^\w{4}-\w{4}$/.test(uid)) {
      return;
    }

    const coreMetricsUrl = `/api/views/${uid}.json?method=opening`;

    $.post({
      url: coreMetricsUrl,
      headers: defaultHeaders
    });
  });

  // We want to flush metrics on unload in case we've queued up some metrics and
  // haven't explicitly flushed.
  $(window).on('beforeunload', () => this.flushMetrics(false));
};

export default Analytics;
