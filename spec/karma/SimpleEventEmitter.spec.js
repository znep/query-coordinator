describe('SimpleEventEmitter', function() {
  'use strict';

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
        assert.isFalse(listener.called);
        emitter.emit();
        assert.isTrue(listener.calledOnce);
      });

      describe('which has been removed', function() {
        beforeEach(function() {
          emitter.removeListener(listener);
        });

        it('should not invoke the listener', function() {
          emitter.emit();
          assert.isFalse(listener.called);
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
          assert.isFalse(listener1.called);
          assert.isFalse(listener2.called);
          emitter.emit();
          assert.isTrue(listener1.calledOnce);
          assert.isTrue(listener2.calledOnce);
        });

        describe('one of which has been removed', function() {
          beforeEach(function() {
            emitter.removeListener(listener2);
          });

          it('should only invoke the remaining listener', function() {
            assert.isFalse(listener1.called);
            emitter.emit();
            assert.isTrue(listener1.calledOnce);
            assert.isFalse(listener2.called);
          });
        });
      });

      describe('which are duplicates', function() {
        beforeEach(function() {
          emitter.addListener(listener1);
          emitter.addListener(listener1);
        });

        it('should invoke each listener the number of times the listener has been added', function() {
          assert.isFalse(listener1.called);
          emitter.emit();
          assert.isTrue(listener1.calledTwice);
        });

        describe('one of which has been removed', function() {
          beforeEach(function() {
            emitter.removeListener(listener1);
          });

          it('should invoke the listener once', function() {
            assert.isFalse(listener1.called);
            emitter.emit();
            assert.isTrue(listener1.calledOnce);
          });
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

        assert.isFalse(otherListener.called);
        emitter.emit();
        assert.isTrue(otherListener.calledOnce);
      });
    });
  });
});
