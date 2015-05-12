describe('Download Service', function() {
  'use strict';
  var DownloadService;
  var testHelpers;
  var $rootScope;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    DownloadService = $injector.get('DownloadService');
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    testHelpers.cleanUp();
  });


  describe('download function', function() {
    var fakeIframe;
    var testScheduler;
    var timeoutScheduler;

    beforeEach(function() {
      testScheduler = new Rx.TestScheduler();
      timeoutScheduler = Rx.Scheduler.timeout;
      Rx.Scheduler.timeout = testScheduler;
      fakeIframe = $('<div id=fakeIframe />');
    });

    afterEach(function() {
      Rx.Scheduler.timeout = timeoutScheduler;
      fakeIframe.remove();
    });

    it('adds a tracking id (correctly) as a query string parameter', function() {
      DownloadService.download('/foo', fakeIframe);

      var iframe = $('#fakeIframe');
      expect(iframe.is(':visible')).to.equal(false);
      expect(iframe.prop('src')).to.match(/\/foo\?renderTrackingId=[0-9]/);
      iframe.remove();

      fakeIframe = $('<div id=fakeIframe />');
      DownloadService.download('/foo?', fakeIframe);
      iframe = $('#fakeIframe');
      expect(iframe.prop('src')).to.match(/\/foo\?renderTrackingId=[0-9]/);
      iframe.remove();

      fakeIframe = $('<div id=fakeIframe />');
      DownloadService.download('/foo?a=b', fakeIframe);
      iframe = $('#fakeIframe');
      expect(iframe.prop('src')).to.match(/\/foo\?a=b&renderTrackingId=[0-9]/);
      iframe.remove();

      fakeIframe = $('<div id=fakeIframe />');
      DownloadService.download('/foo?a=b&', fakeIframe);
      iframe = $('#fakeIframe');
      expect(iframe.prop('src')).to.match(/\/foo\?a=b&&renderTrackingId=[0-9]/);
      iframe.remove();
    });

    it('runs the error callback on timeout', function() {
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();

      DownloadService.download('/foo', fakeIframe).
        then(successCallback, errorCallback);
      testScheduler.advanceTo(60000);
      $rootScope.$digest();

      expect(successCallback).to.have.not.been.called;
      expect(errorCallback).to.have.been.called;
      expect(errorCallback).to.have.been.calledWith({ error: 'timeout' });

      // make sure it cleans up
      expect(fakeIframe.closest('body').length).to.equal(0);
    });

    it('runs the error callback if the page loads', function(done) {
      var realIframe = $('<iframe />');

      var promise = DownloadService.download('/stubs/images/generic-logo.png', realIframe);

      promise.
        then(function() {
          throw new Error('this promise should not be resolved');
        }, function(error) {
          expect(error).to.be.ok;
          expect(error.timeout).not.to.be.ok;
          expect(_.has(error, 'error')).to.equal(true);
          // For IE9, we can't access the contents of the iframe on error, so we just set error.error
          // to true.
          expect('' === error.error || error.error).to.be.ok;
          // make sure it cleans up
          expect(realIframe.closest('body').length).to.equal(0);
          realIframe.remove();
          done();
        });

      // Give it time to load the contentDocument and stuff
      _.defer(function() {
        realIframe.trigger('load');
        $rootScope.$digest();
      });
    });

    it('runs the success callback if the cookie is set, and deletes the cookie', function() {
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();

      DownloadService.download('/foo', fakeIframe).
        then(successCallback, errorCallback);

      var trackingId = fakeIframe.prop('src').split('=')[1];
      document.cookie = 'renderTrackingId_' + trackingId + '=1';
      testScheduler.advanceTo(1500);
      $rootScope.$digest();

      expect(successCallback).to.have.been.called;
      expect(errorCallback).to.have.not.been.called;
      // Chrome doesn't like it when the iframe goes away while you're downloading. So it should
      // be left around.
      expect(fakeIframe.closest('body').length).to.equal(1);
      expect(document.cookie.indexOf('renderTrackingId_' + trackingId)).to.equal(-1);
    });

    it('can take just an error callback', function() {
      var error;

      DownloadService.download('/foo', fakeIframe).then(null, function() {
        error = true;
      });
    });

    it('can take just a success callback', function() {
      var success;

      DownloadService.download('/foo', fakeIframe).then(function() {
        success = true;
      });
    });
  });

});
