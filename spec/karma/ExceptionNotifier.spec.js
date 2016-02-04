describe('ExceptionNotifier', function() {
  'use strict';

  var notifyStub;
  var addFilterStub;
  var ClientStub;
  var consoleErrorStub;
  var originalAirbrakeJs;

  beforeEach(function() {
    notifyStub = sinon.stub();
    addFilterStub = sinon.stub();
    consoleErrorStub = sinon.stub(window.console, 'error');

    originalAirbrakeJs = window.airbrakeJs;
    window.airbrakeJs = { Client: function() {} };

    ClientStub = sinon.stub(window.airbrakeJs, 'Client', function() {
      this.addFilter = addFilterStub;
      this.notify = notifyStub;
    });
  });

  afterEach(function() {
    window.console.error.restore();
    window.airbrakeJs.Client.restore();
    window.airbrakeJs = originalAirbrakeJs;
  });

  describe('initialization', function() {
    describe('options are set', function() {
      var options;
      var exceptionNotifier; //eslint-disable-line no-unused-vars

      beforeEach(function() {
        options = { environment: 'hola', projectKey: 'this is key'};
        exceptionNotifier = new window.storyteller.ExceptionNotifier(options);
      });

      it('instantiates clients with airbrake options', function() {
        assert.isTrue(ClientStub.calledWith({projectKey: 'this is key'}));
      });

      it('sets the environment using addFilter', function() {
        assert.isTrue(addFilterStub.calledOnce);
      });
    });

    describe('options are not set', function() {
      var options;
      var exceptionNotifier; //eslint-disable-line no-unused-vars

      beforeEach(function() {
        options = null;
        exceptionNotifier = new window.storyteller.ExceptionNotifier(options);
      });

      it('instantiates clients with airbrake options', function() {
        assert.isFalse(ClientStub.called);
      });

      it('sets the environment using addFilter', function() {
        assert.isFalse(addFilterStub.called);
      });
    });
  });

  describe('.notify()', function() {
    var exceptionNotifier;

    describe('when airbrake is defined', function() {
      var error = 'hello';

      beforeEach(function() {
        exceptionNotifier = new window.storyteller.ExceptionNotifier({projectKey: 'werdz'});
        exceptionNotifier.notify(error);
      });

      it('calls Client.notify with the error', function() {
        assert.isTrue(notifyStub.calledWith(error));
      });

      it('calls console.error', function() {
        assert.isTrue(consoleErrorStub.calledWith(error));
      });
    });

    describe('when airbrake is undefined', function() {
      var error = 'from the other side';

      beforeEach(function() {
        exceptionNotifier = new window.storyteller.ExceptionNotifier({});
        exceptionNotifier.notify(error);
      });

      it('does not call Client.notify with the error', function() {
        assert.isFalse(notifyStub.calledWith(error));
      });

      it('calls console.error', function() {
        assert.isTrue(consoleErrorStub.calledWith(error));
      });
    });

    describe('Google Analytics', function() {
      var error = 'Google Analytics';

      beforeEach(function() {
        exceptionNotifier = new window.storyteller.ExceptionNotifier();
      });

      describe('ga is defined', function() {
        var gaStub;

        beforeEach(function() {
          window.ga = gaStub = sinon.stub();
          exceptionNotifier.notify(error);
        });

        it('sends Google Analytics information', function() {
          assert.isTrue(
            gaStub.calledWith(
              'send',
              'exception',
              {
                'exDescription': 'Airbrake notification: ' + error,
                'exFatal': false
              }
            )
          );
        });
      });

      describe('ga is undefined', function() {
        it('does nothing', function() {
          assert.doesNotThrow(function() {
            exceptionNotifier.notify(error);
          });
        });
      });
    });
  });
});
