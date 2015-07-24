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

    it('dispatches an `EMBED_WIZARD_UPDATE_YOUTUBE_URL` action on a keyup event from the youtube url input control where `.keyCode` is a url character', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      var event = $.Event('keyup');
      // `a`
      event.keyCode = 65;
      container.find('[data-embed-wizard-validate-field="youTubeId"]').trigger(event);
    });

    it('dispatches an `EMBED_WIZARD_UPDATE_YOUTUBE_URL` action on a keyup event from the youtube url input control where `.keyCode` is a delete key', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      var event = $.Event('keyup');
      // `BACKSPACE`
      event.keyCode = 8;
      container.find('[data-embed-wizard-validate-field="youTubeId"]').trigger(event);
    });

    it('dispatches an `EMBED_WIZARD_UPDATE_YOUTUBE_URL` action on a cut event from the youtube url input control', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      container.find('[data-embed-wizard-validate-field="youTubeId"]').trigger('cut');
    });

    it('dispatches an `EMBED_WIZARD_UPDATE_YOUTUBE_URL` action on a paste event from the youtube url input control', function(done) {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
      });

      window.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      container.find('[data-embed-wizard-validate-field="youTubeId"]').trigger('paste');
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
      assert.isTrue(container.find('[data-embed-action="EMBED_WIZARD_CHOOSE_YOUTUBE"]').length > 0);
    });

    it('renders the "choose YouTube" content on an `EMBED_WIZARD_CHOOSE_YOUTUBE` event', function() {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.equal(container.find('.modal-title').length, 1);
      assert.equal(container.find('.modal-close-btn').length, 1);
      assert.isTrue(container.find('[data-embed-wizard-validate-field="youTubeId"]').length > 0);
    });

    it('renders the YouTube preview in the default state when no url has been supplied', function() {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.isFalse(container.find('.wizard-media-embed-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');
    });

    it('renders the YouTube preview in the invalid state when an invalid YouTube url has been supplied', function() {

      var renderer = new EmbedWizardRenderer(options);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      container.find('[data-embed-wizard-validate-field="youTubeId"]').val('invalid');

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
        url: 'invalid'
      });

      assert.isTrue(container.find('.wizard-media-embed-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');

    });

    it('renders the YouTube preview with the iframe source set to the url when a valid YouTube video url has been supplied', function() {

      var renderer = new EmbedWizardRenderer(options);
      var rickRoll = 'https://youtu.be/dQw4w9WgXcQ';

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      container.find('[data-embed-wizard-validate-field="youTubeId"]').val(rickRoll);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.wizard-media-embed-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
    });

    it('renders the YouTube preview with the iframe source set to the url when valid YouTube embed code has been supplied', function() {

      var renderer = new EmbedWizardRenderer(options);
      var rickRoll = '<iframe width="420" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>';

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      container.find('[data-embed-wizard-validate-field="youTubeId"]').val(rickRoll);

      window.dispatcher.dispatch({
        action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.wizard-media-embed-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
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
