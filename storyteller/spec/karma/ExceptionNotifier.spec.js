import sinon from 'sinon';
import { assert } from 'chai';

import ExceptionNotifier, {__RewireAPI__ as ExceptionNotifierAPI} from '../../app/assets/javascripts/services/ExceptionNotifier';

describe('ExceptionNotifier', function() {

  var notifyStub;
  var addFilterStub;
  var ClientStub;
  var consoleErrorStub;

  beforeEach(function() {
    notifyStub = sinon.stub();
    addFilterStub = sinon.stub();
    consoleErrorStub = sinon.stub(window.console, 'error');

    ClientStub = sinon.spy(function() {
      this.addFilter = addFilterStub;
      this.notify = notifyStub;
    });

    ExceptionNotifierAPI.__Rewire__('Airbrake', ClientStub);

  });

  afterEach(function() {
    window.console.error.restore();
    ExceptionNotifierAPI.__ResetDependency__('Airbrake');
  });

  describe('initialization', function() {
    describe('options are set', function() {
      var options;
      var exceptionNotifier; //eslint-disable-line no-unused-vars

      beforeEach(function() {
        options = { ENVIRONMENT_NAME: 'hola', PROJECT_ID: 'this is key', API_KEY: 'yes'};
        exceptionNotifier = new ExceptionNotifier(options);
      });

      it('instantiates clients with airbrake options', function() {
        assert.isTrue(ClientStub.calledWith({projectId: options.PROJECT_ID, projectKey: options.API_KEY}));
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
        exceptionNotifier = new ExceptionNotifier(options);
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
      var notifyErrorMatcher = sinon.match((arg) => {
        return typeof arg === 'object' && arg.error.message === error;
      });
      var consoleErrorMatcher = sinon.match((arg) => {
        return typeof arg === 'object' && arg.message === error;
      });

      beforeEach(function() {
        exceptionNotifier = new ExceptionNotifier({PROJECT_ID: 'werdz'});
        exceptionNotifier.notify(error);
      });

      it('calls Client.notify with the error', function() {
        assert.isTrue(notifyStub.calledWithMatch(notifyErrorMatcher));
      });

      it('calls console.error', function() {
        assert.isTrue(consoleErrorStub.calledWithMatch(consoleErrorMatcher));
      });
    });

    describe('when airbrake is undefined', function() {
      var error = 'from the other side';
      var consoleErrorMatcher = sinon.match((arg) => {
        return typeof arg === 'object' && arg.message === error;
      });

      beforeEach(function() {
        exceptionNotifier = new ExceptionNotifier({});
        exceptionNotifier.notify(error);
      });

      it('does not call Client.notify with the error', function() {
        assert.isFalse(notifyStub.called);
      });

      it('calls console.error', function() {
        assert.isTrue(consoleErrorStub.calledWithMatch(consoleErrorMatcher));
      });
    });

    describe('Google Analytics', function() {
      var error = 'Google Analytics';

      beforeEach(function() {
        exceptionNotifier = new ExceptionNotifier();
      });

      describe('ga is defined', function() {
        var gaStub;

        beforeEach(function() {
          window.ga = gaStub = sinon.stub();
          exceptionNotifier.notify(error);
        });

        it('sends Google Analytics information', function() {
          assert.isTrue(gaStub.calledWith('send', 'exception', {
            exDescription: `Airbrake notification: ${error}`,
            exFatal: false
          }));
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
