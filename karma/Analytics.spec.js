var _ = require('lodash');
var $ = require('jquery');
var Analytics = require('../src/Analytics');

describe('Anatlyics.js', function() {

  var analytics;
  var server;
  var INITIAL_NAVIGATION_START_TIME = 222;
  var INITIAL_MOMENT_TIME = 1234;
  var DOM_READY_TIME = 4119;
  var fakeClock;

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
      addEventListener: _.noop,
      removeEventListener: _.noop
    },
    navigator: {
      userAgent: 'other'
    }
  };

  beforeEach(function() {
    // setup http request stub for post to analytics url
    analytics = new Analytics();

    // Test with a queue size of one so we can identify at a greater granularity
    // which sendMetric calls are potentially missing or duplicated
    analytics.setMetricsQueueCapacity(1);

    // var addEventListenerSpy = sinon.spy(window, 'addEventListener');
    server = sinon.fakeServer.create();
    server.respondImmediately = true;

    server.respondWith(
      'POST', '/analytics/add',
      [200, { 'Content-Type': 'application/text' }, 'OK']
    );
  });

  afterEach(function() {
    server.restore();
  });

  describe('with upload disabled', function() {
    it('does not report measurements', function() {
      analytics.setServerUploadEnabled(false);
      analytics.sendMetric('some_fake_metric', 'fake_as_hell', 1);
      analytics.flushMetrics();
      assert.lengthOf(server.requests, 0);
    });
  });

  describe('sendMetric()', function() {
    it('sends metric to analytics endpoint', function() {
      analytics.sendMetric('some_fake_metric', 'fake_as_hell', 1);
      analytics.flushMetrics();
      assert.lengthOf(server.requests, 1);
    });
  });

  describe('flushMetrics', function() {
    beforeEach(function(){
      analytics.setMetricsQueueCapacity(3);
    });

    it('does not send metrics until queue capacity is reached', function() {
      analytics.sendMetric('first_metrics', 'not_ready_to_send', 1);
      assert.lengthOf(server.requests, 0);
      analytics.sendMetric('hold', 'HOLD!', 1);
      assert.lengthOf(server.requests, 0);
      analytics.sendMetric('the_straw', 'that_broke_the_camels_queue', 1);
      assert.lengthOf(server.requests, 1);
    });

    it('sends queued metrics', function() {
      analytics.sendMetric('some_fake_metric', 'fake_as_hell', 1);
      analytics.flushMetrics();
      assert.lengthOf(server.requests, 1);
    });

    describe('outgoing requests', function() {
      var analytics_request;

      beforeEach(function() {
        analytics.sendMetric('booyah', 'things', 666);
        analytics.flushMetrics();
        analytics_request = server.requests[0];
      });

      it('sets content type', function() {
        assert.match(analytics_request.requestHeaders['Content-Type'], /application\/text/);
      });

      it('sets X-Socrata-Auth header', function() {
        assert.equal(
          analytics_request.requestHeaders['X-Socrata-Auth'],
          'unauthenticated'
        );
      });

      it('sends metrics data', function() {
        assert.equal(
          analytics_request.requestBody,
          '{"metrics":[{"entity":"booyah","metric":"things","increment":666}]}'
        );
      });

      it('sends metrics asynchronously by default', function() {
        assert.isTrue(analytics_request.async);
      });
    });
  });

  describe('window.onbeforeunload', function() {
    beforeEach(function() {
      analytics.setMetricsQueueCapacity(3);
    });

    // TODO: Has this ever worked? I don't know!
    // I do know that it causes the test run to fail sometimes, but not always!
    xit('calls flushMetrics()', function() {
      analytics.sendMetric('waiting', 'forunload', 123);

      $(window).trigger('onbeforeunload');

      setTimeout(function() {
        assert.lengthOf(server.requests, 1);
        assert.isFalse(server.requests[0].async);
      }, 10);
    });
  });
});
