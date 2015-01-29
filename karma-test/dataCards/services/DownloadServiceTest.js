describe('Download Service', function() {
  'use strict';
  var DownloadService;
  var fakeClock;
  var testHelpers;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    DownloadService = $injector.get('DownloadService');
    testHelpers = $injector.get('testHelpers');

    fakeClock = sinon.useFakeTimers();
  }));

  afterEach(function() {
    fakeClock.restore();
  });


  describe('download function', function() {
    var fakeIframe;

    beforeEach(function() {
      fakeIframe = $('<div id=fakeIframe />');
    });

    afterEach(function() {
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
      var success;
      var error;

      DownloadService.download('/foo', fakeIframe).then(function() {
        success = true;
      }, function(obj) {
        error = obj;
      });
      fakeClock.tick(60000);

      expect(success).not.to.equal(true);
      expect(error).to.be.ok;
      expect(error.timeout).to.equal(true);

      // make sure it cleans up
      expect(fakeIframe.closest('body').length).to.equal(0);
    });

    it('runs the error callback if the page loads', function(done) {
      var realIframe = $('<iframe />');

      DownloadService.download('/stubs/images/generic-logo.png', realIframe).
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
      });
    });

    it('runs the success callback if the cookie is set, and deletes the cookie', function() {
      var success;
      var error;

      DownloadService.download('/foo', fakeIframe).then(function() {
        success = true;
      }, function(obj) {
        error = obj;
      });
      var trackingId = fakeIframe.prop('src').split('=')[1];
      document.cookie = 'renderTrackingId_' + trackingId + '=1';
      fakeClock.tick(1500);

      expect(success).to.equal(true);
      expect(error).not.to.be.ok;
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
