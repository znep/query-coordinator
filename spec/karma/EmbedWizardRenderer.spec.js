describe('EmbedWizardRenderer', function() {

  var container;
  var options;
  var testBlockId = 'testBlock1';
  var testComponentIndex = 1;

  beforeEach(function() {
    container = $('<div>', { class: 'embed-wizard-container' });

    testDom.append(container);

    options = {
      embedWizardContainerElement: testDom.find('.embed-wizard-container'),
    };
  });

  describe('constructor', function() {

    describe('when passed a configuration object', function() {

      describe('with no `embedWizardContainerElement` property', function() {

        it('raises an exception', function() {

          delete options.embedWizardContainerElement;

          assert.throws(function() {
            var renderer = new EmbedWizardRenderer(options);
          });
        });
      });

      describe('with an `embedWizardContainerElement` property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.embedWizardContainerElement = {};

          assert.throws(function() {
            var renderer = new EmbedWizardRenderer(options);
          });
        });
      });

      describe('with an `embedWizardContainerElement` property that is a jQuery object', function() {

        it('appends a `.modal-overlay` and a `.modal-dialog` to the `embedWizardContainerElement`', function() {

          var renderer = new EmbedWizardRenderer(options);

          assert.equal(container.find('.modal-overlay').length, 1);
          assert.equal(container.find('.modal-dialog').length, 1);
        });
      });
    });
  });

  describe('event handlers', function() {

    it('dispatches an `EMBED_WIZARD_CLOSE` action when the escape key is pressed', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_CLOSE);
        done();
      });

      var event = $.Event('keyup');
      // `ESC`
      event.keyCode = 27;
      $(document).trigger(event);
    });

    it('dispatches an `EMBED_WIZARD_CLOSE` action when the overlay is clicked', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_CLOSE);
        done();
      });

      container.find('.modal-overlay').trigger('click');
    });

    it('dispatches an `EMBED_WIZARD_CLOSE` action when the modal dialog close button is clicked', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_CLOSE);
        done();
      });

      container.find('.modal-close-btn').trigger('click');
    });
  });

  describe('rendering', function() {

    it('renders the "choose provider" content on an `EMBED_WIZARD_CHOOSE_PROVIDER` event', function() {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.equal(container.find('.modal-title').length, 1);
      assert.equal(container.find('.modal-close-btn').length, 1);
      assert.isTrue(container.find('.accent-btn').length > 0);
    });

    it('closes the modal on an `EMBED_WIZARD_CLOSE` event', function() {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.isFalse(container.hasClass('hidden'));

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CLOSE
      });

      assert.isTrue(container.hasClass('hidden'));
    });
  });
});
