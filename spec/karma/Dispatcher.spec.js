describe('Dispatcher', function() {
  describe('constructor', function() {
    it('accepts zero arguments', function() {
      var dispatcher = new window.socrata.storyteller.Dispatcher();
      assert.instanceOf(dispatcher, window.socrata.storyteller.Dispatcher);
    });
  });

  describe('instance', function() {
    var dispatcher;
    var handler1;
    var handler2;
    var handler1Token;
    var handler2Token;

    beforeEach(function() {
      dispatcher = new window.socrata.storyteller.Dispatcher();
      handler1 = sinon.spy();
      handler2 = sinon.spy();
      handler1Token = dispatcher.register(handler1);
      handler2Token = dispatcher.register(handler2);
    });

    describe('.dispatch', function() {

      var payload = {
        name: 'A'
      };

      it('should call all handlers', function() {
        dispatcher.dispatch(payload);
        assert.isTrue(handler1.calledOnce, 'expected handler to be called');
        assert.isTrue(handler2.calledOnce, 'expected handler to be called');
      });

      it('should call handlers with the original action arguments', function() {
        dispatcher.dispatch(payload);
        assert.isTrue(
          handler1.calledWith(payload),
          'expected handler to be called with original action arguments'
        );

        assert.isTrue(
          handler2.calledWith(payload),
          'expected handler to be called with original action arguments'
        );
      });
    });

    describe('.register', function() {

      it('should throw when called with no arguments', function() {
        assert.throw(function() {
          dispatcher.register();
        });
      });

      it('should throw when the argument is not a function', function() {
        assert.throw(function() {
          dispatcher.register([]);
        });
        assert.throw(function() {
          dispatcher.register({});
        });
        assert.throw(function() {
          dispatcher.register(5);
        });
      });

      it('should not throw when the argument is a function', function() {
        dispatcher.register(function() { });
      });

    });

    describe('unregister', function() {
      it('should detach the event handler', function() {
        var payload = {};

        dispatcher.unregister(handler1Token);

        dispatcher.dispatch(payload);
        assert.isFalse(handler1.called, 'expected handler not to be called');
        assert.isTrue(handler2.calledOnce, 'expected handler to be called');
      });
    });
  });
});
