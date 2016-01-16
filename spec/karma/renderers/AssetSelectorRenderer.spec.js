describe('AssetSelectorRenderer', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  var container;
  var options;
  var testBlockId = 'testBlock1';
  var testComponentIndex = 1;
  var AssetSelectorRenderer;
  var server;

  beforeEach(function() {
    // Since these tests actually expect to use AJAX, we need to disable the
    // mocked XMLHttpRequest (which happens in StandardMocks) before each,
    // and re-enble it after each.
    window.mockedXMLHttpRequest.restore();

    server = sinon.fakeServer.create();

    AssetSelectorRenderer = storyteller.AssetSelectorRenderer;

    container = $('<div>', { 'class': 'asset-selector-container' });

    testDom.append(container);

    options = {
      assetSelectorContainerElement: testDom.find('.asset-selector-container')
    };
  });

  afterEach(function() {
    server.restore();

    // See comment above re: temporarily disabling the mocked XMLHttpRequest.
    window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
  });

  describe('constructor', function() {

    describe('when passed a configuration object', function() {

      describe('with no `assetSelectorContainerElement` property', function() {

        it('raises an exception', function() {

          delete options.assetSelectorContainerElement;

          assert.throws(function() {
            new AssetSelectorRenderer(options); //eslint-disable-line no-new
          });
        });
      });

      describe('with an `assetSelectorContainerElement` property that is not a jQuery object', function() {

        it('raises an exception', function() {

          options.assetSelectorContainerElement = {};

          assert.throws(function() {
            new AssetSelectorRenderer(options); //eslint-disable-line no-new
          });
        });
      });

      describe('with an `assetSelectorContainerElement` property that is a jQuery object', function() {

        it('appends a `.modal-overlay` and a `.modal-dialog` to the `assetSelectorContainerElement`', function() {

          new AssetSelectorRenderer(options); //eslint-disable-line no-new

          assert.equal(container.find('.modal-overlay').length, 1);
          assert.equal(container.find('.modal-dialog').length, 1);
        });
      });
    });
  });

  describe('event handlers', function() {

    beforeEach(function() {
      new AssetSelectorRenderer(options); //eslint-disable-line no-new
    });

    it('dispatches an `ASSET_SELECTOR_CLOSE` action when the escape key is pressed', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CLOSE);
        done();
      });

      var event = $.Event('keyup'); //eslint-disable-line new-cap
      // `ESC`
      event.keyCode = 27;
      $(document).trigger(event);
    });

    it('dispatches an `ASSET_SELECTOR_CLOSE` action when the overlay is clicked', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CLOSE);
        done();
      });

      container.find('.modal-overlay').trigger('click');
    });

    it('dispatches an `ASSET_SELECTOR_CLOSE` action when the modal dialog close button is clicked', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CLOSE);
        done();
      });

      container.find('.modal-close-btn').trigger('click');
    });

    it('dispatches an `ASSET_SELECTOR_UPDATE_YOUTUBE_URL` action on a keyup event from the youtube url input control where `.keyCode` is a url character', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        provider: 'YOUTUBE'
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      var event = $.Event('keyup'); //eslint-disable-line new-cap
      // `a`
      event.keyCode = 65;
      container.find('[data-asset-selector-validate-field="youtubeId"]').trigger(event);
    });

    it('dispatches an `ASSET_SELECTOR_UPDATE_YOUTUBE_URL` action on a keyup event from the youtube url input control where `.keyCode` is a delete key', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        provider: 'YOUTUBE'
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      var event = $.Event('keyup'); //eslint-disable-line new-cap
      // `BACKSPACE`
      event.keyCode = 8;
      container.find('[data-asset-selector-validate-field="youtubeId"]').trigger(event);
    });

    it('dispatches an `ASSET_SELECTOR_UPDATE_YOUTUBE_URL` action on a cut event from the youtube url input control', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        provider: 'YOUTUBE'
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').trigger('cut');
    });

    it('dispatches an `ASSET_SELECTOR_UPDATE_YOUTUBE_URL` action on a paste event from the youtube url input control', function(done) {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        provider: 'YOUTUBE'
      });

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL);
        assert.equal(payload.url, '');
        done();
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').trigger('paste');
    });

    it('dispatches `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` on a datasetSelected event', function(done) {

      storyteller.dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET);
        // the values will be empty, but assert that the event adds the keys
        assert.property(payload, 'datasetUid');
        assert.property(payload, 'isNewBackend');
        done();
      });

      container.find('.modal-dialog').trigger('datasetSelected', {});
    });

    it('dispatches `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` on a visualizationSelected event', function(done) {
      storyteller.assetSelectorStore.addChangeListener(function() {
        _.defer(function() {
          container.find('.modal-dialog').trigger('visualizationSelected', {format: 'vif', data: {}});
        });
      });

      // add dataset so the proper component values are there for updating
      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
        datasetUid: standardMocks.validStoryUid,
        isNewBackend: true
      });
      server.respond([200, {}, '{}']);


      storyteller.dispatcher.register(function(payload) {
        assert.equal(payload.action, Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION);
        // the values will be empty, but assert that the event adds the correct keys
        assert.property(payload, 'visualization');
        assert.property(payload.visualization, 'format');
        done();
      });
    });

    describe('select file in image upload', function() {
      var mockFile = {
        name: 'fake-file.png',
        type: 'image/png',
        size: 1024 * 2
      };

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        });
      });

      it('verifies a file is selected before starting an upload', function() {
        container.find('[data-asset-selector-validate-field="imageUpload"]').trigger('change', { target: { files: [] }});
        assert.isTrue(storyteller.fileUploader === undefined);
      });

      it('starts uploading the selected file', function() {
        container.find('[data-asset-selector-validate-field="imageUpload"]').trigger('change', { target: { files: [mockFile] }});
        assert.isTrue(storyteller.fileUploader !== null);
      });

      // TODO No easy way to test this with the current implementation.
      // Need to move it into a singleton.
      xdescribe('when an upload is already in progress', function() {
        beforeEach(function() {
          storyteller.FileUploaderMocker.mock();
          storyteller.fileUploader = new storyteller.FileUploader();
          sinon.spy(storyteller.fileUploader, 'destroy');
        });

        afterEach(function() {
          storyteller.FileUploaderMocker.unmock();
          delete storyteller.fileUploader;
        });

        it('cancels previous uploads in progress', function() {
          container.find('[data-asset-selector-validate-field="imageUpload"]').trigger('change', { target: { files: [mockFile] }});
          assert.isTrue(storyteller.fileUploader.destroy.calledOnce);
        });
      });
    });
  });

  describe('when rendering', function() {
    beforeEach(function() {
      new AssetSelectorRenderer(options); //eslint-disable-line no-new
    });

    it('renders the "choose provider" content on an `ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT` event', function() {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.equal(container.find('.modal-title').length, 1);
      assert.equal(container.find('.modal-close-btn').length, 1);
      assert.isTrue(container.find('[data-provider="YOUTUBE"]').length > 0);
      assert.isTrue(container.find('[data-provider="SOCRATA_VISUALIZATION"]').length > 0);
      assert.isTrue(container.find('[data-provider="EMBED_CODE"]').length > 0);
      assert.isTrue(container.find('[data-provider="IMAGE"]').length > 0);
    });

    it('renders the "choose YouTube" content on an appropriate `ASSET_SELECTOR_PROVIDER_CHOSEN` event', function() {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      assert.equal(container.find('.modal-title').length, 1);
      assert.equal(container.find('.modal-close-btn').length, 1);
      assert.isTrue(container.find('[data-asset-selector-validate-field="youtubeId"]').length > 0);
    });

    it('renders the YouTube preview in the default state when no url has been supplied', function() {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');
    });

    it('renders the YouTube preview in the invalid state when an invalid YouTube url has been supplied', function() {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val('invalid');

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: 'invalid'
      });

      assert.isTrue(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');

    });

    it('renders the YouTube preview with the iframe source set to the url when a valid YouTube video url has been supplied', function() {

      var rickRoll = 'https://youtu.be/dQw4w9WgXcQ';

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val(rickRoll);

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
    });

    it('renders the YouTube preview with the iframe source set to the url when valid YouTube embed code has been supplied', function() {

      var rickRoll = '<iframe width="420" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>';

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val(rickRoll);

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
    });

    it('closes the modal on an `ASSET_SELECTOR_CLOSE` event', function() {

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.isFalse(container.hasClass('hidden'));

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });

      assert.isTrue(container.hasClass('hidden'));
    });

    describe('when a `ASSET_SELECTOR_PROVIDER_CHOSEN` action with provider = SOCRATA_VISUALIZATION is fired', function() {

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'SOCRATA_VISUALIZATION'
        });
      });

      it('renders an iframe', function() {
        assert.equal(container.find('.asset-selector-dataset-chooser-iframe').length, 1);
      });

      describe('the iframe', function() {
        it('has the correct source', function() {
          var iframeSrc = container.find('iframe').attr('src');
          assert.include(iframeSrc, 'browse/select_dataset');
          assert.include(iframeSrc, 'suppressed_facets');
          assert.include(iframeSrc, 'limitTo=datasets');
        });

        it('has a modal title loading spinner', function() {
          assert.lengthOf(container.find('.btn-busy:not(.hidden)'), 1);
        });
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has the wide class to display the iframe', function() {
          assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
        });

        it('has a button that goes back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_ASSET_PROVIDER"]'),
            1
          );
        });

      });
    });

    describe('when a `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action is fired', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
          storyUid: standardMocks.validStoryUid,
          blockId: standardMocks.validBlockId,
          componentIndex: 0
        });
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          datasetUid: standardMocks.validStoryUid,
          isNewBackend: true
        });
        server.respond([
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            newBackend: true,
            columns: [{
              'fieldName': 'foo'
            }]
          })
        ]);
      });

      it('has a button that goes to the chart visualization page', function() {
        container.find('.btn-visualize-chart').click();
        assert.equal(
          storyteller.assetSelectorStore.getStep(),
          storyteller.AssetSelectorStore.WIZARD_STEP.CONFIGURE_VISUALIZATION
        );
      });

      it('has a button that inserts a table', function(done) {
        storyteller.dispatcher.register(function(payload) {
          if (payload.action === Actions.BLOCK_UPDATE_COMPONENT) {
            assert.equal(
              payload.value.vif.type,
              'table'
            );
            done();
          }
        });

        container.find('.btn-visualize-table').click();
      });

      describe('then `ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP` is fired', function() {
        beforeEach(function() {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP
          });
        });

        it('renders an iframe', function() {
          assert.equal(container.find('.asset-selector-configure-visualization-iframe').length, 1);
        });

        it('disables the insert button on render', function() {
          assert.equal(
            container.find('.btn-primary').attr('disabled'),
            'disabled'
          );
        });

        describe('the iframe', function() {
          it('has the correct src', function() {
            var iframeSrc = container.find('iframe').attr('src');
            assert.include(iframeSrc, 'component/visualization/add?datasetId');
          });

          it('has a modal title loading spinner', function() {
            assert.lengthOf(container.find('.btn-busy:not(.hidden)'), 1);
          });
        });

        describe('the modal', function() {
          it('has a close button', function() {
            assert.equal(container.find('.modal-close-btn').length, 1);
          });

          it('has the wide class to display the iframe', function() {
            assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
          });

          it('has a button that goes back to the choose table/chart page', function() {
            assert.lengthOf(
              container.find('[data-resume-from-step="SELECT_TABLE_OR_CHART"]'),
              1
            );
          });

        });
      });
    });

    describe('when a `ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD` action is fired', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        });
      });

      it('renders a file input', function() {
        assert.equal(
          container.find('[data-asset-selector-validate-field="imageUpload"]').attr('type'),
          'file'
        );
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_ASSET_PROVIDER"]'),
            1
          );
        });

        it('has a disabled insert button', function() {
          assert.isTrue(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });

    describe('when a `FILE_UPLOAD_PROGRESS` action is fired', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_PROGRESS,
          percentLoaded: 0
        });
      });

      it('has a spinner', function() {
        var $busy = container.find('.btn-busy');
        assert.lengthOf($busy, 1);
        assert.notInclude($busy.attr('class'), 'hidden');
      });

      it('has a cancel button in the progress pane', function() {
        assert.lengthOf(
          container.find('[data-resume-from-step="SELECT_IMAGE_TO_UPLOAD"]'),
          1
        );
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the choose image upload step', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_IMAGE_TO_UPLOAD"]'),
            1
          );
        });

        it('has a disabled insert button', function() {
          assert.isTrue(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });

    describe('when a `FILE_UPLOAD_ERROR` action is fired', function() {
      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_ERROR,
          error: {
            step: 'get_resource',
            reason: { status: 400, message: 'Bad Request' }
          }
        });
      });

      it('removes cancel button, replaces with try again', function() {
        var buttonSelector =
          container.find('.asset-selector-try-again');
        assert.lengthOf(buttonSelector, 1);
        assert.isFalse(buttonSelector.hasClass('hidden'));
        assert.lengthOf(container.find('.asset-selector-cancel-upload'), 0);
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.lengthOf(container.find('.modal-close-btn'), 1);
        });

        it('has a button that goes back to the choose image upload step', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_IMAGE_TO_UPLOAD"]'),
            1
          );
        });

        it('has a disabled insert button', function() {
          assert.isTrue(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });

    describe('when a `FILE_UPLOAD_DONE` action is fired', function() {
      var imageUrl = 'https://media.giphy.com/media/I8BOASC4LS0rS/giphy.gif';
      var documentId = 9876;
      var imgEl;

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE,
          url: imageUrl,
          documentId: documentId
        });
        imgEl = container.find('.asset-selector-preview-image');
      });

      it('renders a preview image from the payload URL', function() {
        assert.equal(imgEl.attr('src'), imageUrl);
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the choose image upload step', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_IMAGE_TO_UPLOAD"]'),
            1
          );
        });

        it('has an enabled insert button', function() {
          assert.isFalse(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });
  });
});
