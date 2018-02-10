import sinon from 'sinon';
import { assert } from 'chai';

import SimpleEventEmitter from '../../app/assets/javascripts/editor/SimpleEventEmitter';

describe('SimpleEventEmitter', function() {
  var emitter;

  beforeEach(function() {
    emitter = new SimpleEventEmitter();
  });

  describe('.emit', function() {
    describe('with no listeners', function() {
      it('should not crash', function() {
        emitter.emit();
      });
    });

    describe('with one listener', function() {
      var listener;

      beforeEach(function() {
        listener = sinon.spy();
        emitter.addListener(listener);
      });

      it('should invoke the listener once', function() {
        sinon.assert.notCalled(listener);
        emitter.emit();
        sinon.assert.calledOnce(listener);
      });

      describe('which has been removed', function() {
        beforeEach(function() {
          emitter.removeListener(listener);
        });

        it('should not invoke the listener', function() {
          emitter.emit();
          sinon.assert.notCalled(listener);
        });
      });
    });

    describe('with multiple listeners', function() {
      var listener1;
      var listener2;
      beforeEach(function() {
        listener1 = sinon.spy();
        listener2 = sinon.spy();
      });

      describe('which are all distinct', function() {
        beforeEach(function() {
          emitter.addListener(listener1);
          emitter.addListener(listener2);
        });

        it('should invoke each listener once', function() {
          sinon.assert.notCalled(listener1);
          sinon.assert.notCalled(listener2);
          emitter.emit();
          sinon.assert.calledOnce(listener1);
          sinon.assert.calledOnce(listener2);
        });

        describe('one of which has been removed', function() {
          beforeEach(function() {
            emitter.removeListener(listener2);
          });

          it('should only invoke the remaining listener', function() {
            sinon.assert.notCalled(listener1);
            emitter.emit();
            sinon.assert.calledOnce(listener1);
            sinon.assert.notCalled(listener2);
          });
        });
      });

      describe('which are duplicates', function() {
        beforeEach(function() {
          emitter.addListener(listener1);
          emitter.addListener(listener1);
        });

        it('should invoke each listener the number of times the listener has been added', function() {
          sinon.assert.notCalled(listener1);
          emitter.emit();
          sinon.assert.calledTwice(listener1);
        });

        describe('one of which has been removed', function() {
          beforeEach(function() {
            emitter.removeListener(listener1);
          });

          it('should invoke the listener once', function() {
            sinon.assert.notCalled(listener1);
            emitter.emit();
            sinon.assert.calledOnce(listener1);
          });
        });
      });

      // We honor the removal immediately.
      //
      // This is a tricky case. We _could_ force all the listeners
      // that were registered at the beginning of the .emit() call
      // to run, but that would potentially cause surprising results.
      describe('which get removed during events', () => {
        beforeEach(function() {
          // I want to use .callsFake() but our sinon is so ancient it doesn't
          // support it :(
          listener1 = sinon.spy(() => {
            emitter.removeListener(listener2);
          });
          emitter.addListener(listener1);
          emitter.addListener(listener2);
        });

        it('should honor the removal', function() {
          sinon.assert.notCalled(listener1);
          sinon.assert.notCalled(listener2);
          emitter.emit();
          sinon.assert.calledOnce(listener1);
          sinon.assert.notCalled(listener2);
        });
      });

    });

  });

  describe('.addListener', function() {
    describe('given a non-function as an argument', function() {
      it('should throw', function() {
        assert.throws(function() { emitter.addListener(); });
        assert.throws(function() { emitter.addListener(null); });
        assert.throws(function() { emitter.addListener(5); });
        assert.throws(function() { emitter.addListener(''); });
        assert.throws(function() { emitter.addListener({}); });
        assert.throws(function() { emitter.addListener([]); });
      });
    });
  });

  describe('.removeListener', function() {
    describe('given a non-function as an argument', function() {
      it('should throw', function() {
        assert.throws(function() { emitter.removeListener(); });
        assert.throws(function() { emitter.removeListener(null); });
        assert.throws(function() { emitter.removeListener(5); });
        assert.throws(function() { emitter.removeListener(''); });
        assert.throws(function() { emitter.removeListener({}); });
        assert.throws(function() { emitter.removeListener([]); });
      });
    });

    describe('given a callback which has not been added', function() {
      it('should have no effect', function() {
        var otherListener = sinon.spy();

        emitter.addListener(otherListener);
        emitter.removeListener(function() {});

        sinon.assert.notCalled(otherListener);
        emitter.emit();
        sinon.assert.calledOnce(otherListener);
      });
    });
  });
});
