describe('Polaroid Service', function() {
  'use strict';

  var PolaroidService;
  var testHelpers;
  var $rootScope;
  var $httpBackend;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    PolaroidService = $injector.get('PolaroidService');
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
  }));

  beforeEach(function() {
    sinon.stub(window, 'saveAs', _.noop);
  });

  afterEach(function() {
    window.saveAs.restore();
  });

  afterEach(function() {
    testHelpers.cleanUp();
  });

  describe('download function', function() {
    var fakeVif;
    var testScheduler;
    var timeoutScheduler;

    beforeEach(function() {
      testScheduler = new Rx.TestScheduler();
      timeoutScheduler = Rx.Scheduler.timeout;
      Rx.Scheduler.timeout = testScheduler;
      fakeVif = { name: 'myFirstVif' };
      document.cookie = 'socrata-csrf-token=[$|2f-70k3n';
    });

    afterEach(function() {
      Rx.Scheduler.timeout = timeoutScheduler;
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('adds a tracking id (correctly) as a query string parameter', function() {
      $httpBackend.whenPOST(/\/foo\?renderTrackingId=[0-9]/).respond('');
      PolaroidService.download('/foo?', fakeVif);
      $httpBackend.flush();

      $httpBackend.whenPOST(/\/foo\?a=b&renderTrackingId=[0-9]/).respond('');
      PolaroidService.download('/foo?a=b', fakeVif);
      $httpBackend.flush();

      $httpBackend.whenPOST(/\/foo\?a=b&&renderTrackingId=[0-9]/).respond('');
      PolaroidService.download('/foo?a=b&', fakeVif);
      $httpBackend.flush();
    });

    it('runs the error callback on timeout', function() {
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();

      $httpBackend.whenPOST(/\/foo/).respond('');

      PolaroidService.download('/foo', fakeVif).then(successCallback, errorCallback);
      testScheduler.advanceTo(60000);

      $httpBackend.flush();

      expect(successCallback).to.have.not.been.called;
      expect(errorCallback).to.have.been.called;
      expect(errorCallback).to.have.been.calledWith({ error: 'timeout' });
    });

    it('runs the success callback if the request succeeds', function() {
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();

      $httpBackend.whenPOST(/\/foo/).respond('');
      PolaroidService.download('/foo', fakeVif).then(successCallback, errorCallback);
      $httpBackend.flush();

      expect(successCallback).to.have.been.called;
      expect(errorCallback).to.have.not.been.called;
    });

    it('can take just an error callback', function() {
      $httpBackend.whenPOST(/\/foo/).respond('');
      PolaroidService.download('/foo', fakeVif).then(null, function() {
        //
      });

      $httpBackend.flush();
    });

    it('can take just a success callback', function() {
      $httpBackend.whenPOST(/\/foo/).respond('');
      PolaroidService.download('/foo', fakeVif).then(function() {
        //
      });

      $httpBackend.flush();
    });
  });

});
