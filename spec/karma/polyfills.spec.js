describe('Polyfills', function() {

  describe('CustomEvent', function() {

    beforeEach(function() {
      $('body').append(
        $('<div>', { class: 'listener' })
      );
    });

    afterEach(function() {
      $('.listener').remove();
    });

    describe('when called without explicit params', function() {

      it('emits an event with the default properties', function(done) {

        $('.listener').on('test-event', function(e) {
          assert.isFalse(e.bubbles, 'bubbles is false');
          assert.isFalse(e.cancelable, 'cancelable is false');
          assert.isUndefined(e.originalEvent.detail, 'detail is undefined');
          done();
        });

        var customEvent = new CustomEvent('test-event');
        $('.listener')[0].dispatchEvent(customEvent);
      });
    });

    describe('when called with explicit params', function() {

      it('emits an event with the specified properties', function(done) {

        $('.listener').on('test-event', function(e) {
          assert.isTrue(e.bubbles, 'bubbles is true');
          assert.isTrue(e.cancelable, 'cancelable is true');
          assert(e.originalEvent.detail === 'test', 'detail is "test"');
          done();
        });

        var params = {
          bubbles: true,
          cancelable: true,
          detail: 'test'
        };
        var customEvent = new CustomEvent('test-event', params);
        $('.listener')[0].dispatchEvent(customEvent);
      });
    });
  });
});
