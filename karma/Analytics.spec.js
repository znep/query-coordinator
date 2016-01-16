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
      expect(server.requests).to.be.empty;
    });
  });

  describe('sendMetric()', function() {
    it('sends metric to analytics endpoint', function() {
      analytics.sendMetric('some_fake_metric', 'fake_as_hell', 1);
      analytics.flushMetrics();
      analytics_request = server.requests[0];
    });
  });

  describe('flushMetrics', function() {
    beforeEach(function(){
      analytics.setMetricsQueueCapacity(100);
    });

    it('sends queued metrics', function() {
      analytics.sendMetric('some_fake_metric', 'fake_as_hell', 1);
      expect(server.requests).to.be.empty;
      analytics.flushMetrics();
      expect(server.requests.length).to.equal(1);
    });

    describe('outgoing requests', function() {
      var analytics_request;

      beforeEach(function() {
        analytics.sendMetric('booyah', 'things', 666);
        analytics.flushMetrics();
        analytics_request = server.requests[0];
      });

      it('sets content type', function() {
        expect(analytics_request.requestHeaders['Content-Type']).to.match(/application\/text/);
      });

      it('sets X-Socrata-Auth header', function() {
        expect(analytics_request.requestHeaders['X-Socrata-Auth']).to.equal('unauthenticated');
      });

      it('sends metrics data', function() {
        expect(analytics_request.requestBody).to.equal('{"metrics":[{"entity":"booyah","metric":"things","increment":666}]}');
      });
    });
  });

  describe('window.onbeforeunload', function() {
    beforeEach(function() {
      analytics.setMetricsQueueCapacity(100);
    });

    it('calls flushMetrics()', function() {
      analytics.sendMetric('waiting', 'forunload', 123);

      $(window).trigger('onbeforeunload');

      setTimeout(function() {
        expect(server.requests.length).to.equal(1);
      }, 10);
    });
  });
});
