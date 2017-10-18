import $ from 'jquery';
import { Analytics } from 'common/analytics';

describe('analytics.js', function() {

  var analytics;
  var server;

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
    beforeEach(function() {
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
      var analyticsRequest;

      beforeEach(function() {
        analytics.sendMetric('booyah', 'things', 666);
        analytics.flushMetrics();
        analyticsRequest = server.requests[0];
      });

      it('sets content type', function() {
        assert.match(analyticsRequest.requestHeaders['Content-Type'], /application\/text/);
      });

      it('sets X-Socrata-Auth header', function() {
        assert.equal(
          analyticsRequest.requestHeaders['X-Socrata-Auth'],
          'unauthenticated'
        );
      });

      it('sends metrics data', function() {
        assert.equal(
          analyticsRequest.requestBody,
          '{"metrics":[{"entity":"booyah","metric":"things","increment":666}]}'
        );
      });

      it('sends metrics asynchronously by default', function() {
        assert.isTrue(analyticsRequest.async);
      });
    });
  });

  describe('window.onbeforeunload', function() {
    beforeEach(function() {
      analytics.setMetricsQueueCapacity(3);
    });

    // NOTE: Test fails due to full page reload.
    xit('calls flushMetrics()', function() {
      analytics.sendMetric('waiting', 'forunload', 123);

      $(window).triggerHandler('beforeunload');

      setTimeout(function() {
        assert.lengthOf(server.requests, 1);
        assert.isFalse(server.requests[0].async);
      }, 10);
    });
  });

  describe('registerPageView', function() {
    beforeEach(function() {
      server.respondWith(
        'POST', '/api/views/test-test/metrics.json?method=opening',
        [200, { 'Content-Type': 'application/text' }, 'OK']
      );
    });

    it('makes a POST request to the Core metrics endpoint', function() {
      analytics.registerPageView('test-test');
      assert.lengthOf(server.requests, 1);
    });

    it('does not allow duplicate page views to be registered', function() {
      analytics.registerPageView('test-test');
      analytics.registerPageView('test-test');
      assert.lengthOf(server.requests, 1);
    });
  });
});
