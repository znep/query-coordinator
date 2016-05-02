import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import StandardMocks from '../StandardMocks';
import story from '../fixtures/Story';

import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import Actions from '../../../app/assets/javascripts/editor/Actions';
import Dispatcher from '../../../app/assets/javascripts/editor/Dispatcher';
import AssetSelectorRenderer, {__RewireAPI__ as AssetSelectorRendererAPI} from '../../../app/assets/javascripts/editor/renderers/AssetSelectorRenderer';
import {__RewireAPI__ as StoreAPI} from '../../../app/assets/javascripts/editor/stores/Store';
import AssetSelectorStore, {__RewireAPI__ as AssetSelectorStoreAPI, WIZARD_STEP} from '../../../app/assets/javascripts/editor/stores/AssetSelectorStore';

describe('AssetSelectorRenderer', function() {

  var container;
  var options;
  var testBlockId = 'testBlock1';
  var testComponentIndex = 1;
  var assetSelectorStoreMock;
  var server;
  var dispatcher;

  beforeEach(function() {
    server = sinon.fakeServer.create();

    container = $('<div>', { 'class': 'asset-selector-container' });
    $transient.append(container);

    options = {
      assetSelectorContainerElement: $transient.find('.asset-selector-container')
    };

    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('storyStore', {
      getBlockComponentAtIndex: _.constant({
        type: 'image'
      })
    });

    assetSelectorStoreMock = new AssetSelectorStore();

    AssetSelectorRendererAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorRendererAPI.__Rewire__('assetSelectorStore', assetSelectorStoreMock);

    dispatcher.dispatch({
      action: Actions.STORY_CREATE,
      data: story()
    });
  });

  afterEach(function() {
    server.restore();

    StoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('dispatcher');
    AssetSelectorStoreAPI.__ResetDependency__('storeStore');
    AssetSelectorRendererAPI.__ResetDependency__('dispatcher');
    AssetSelectorRendererAPI.__ResetDependency__('assetSelectorStore');
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
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      dispatcher.register(function(payload) {
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
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CLOSE);
        done();
      });

      container.find('.modal-overlay').trigger('click');
    });

    it('dispatches an `ASSET_SELECTOR_CLOSE` action when the modal dialog close button is clicked', function(done) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CLOSE);
        done();
      });

      container.find('.modal-close-btn').trigger('click');
    });

    describe('event triggered in youtube url field', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'YOUTUBE'
        });
      });

      it('dispatches an `ASSET_SELECTOR_UPDATE_YOUTUBE_URL` action on an input event from the youtube url input field', function(done) {
        dispatcher.register(function(payload) {
          var action = payload.action;
          assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL);
          assert.equal(payload.url, '');
          done();
        });

        var event = $.Event('input'); //eslint-disable-line new-cap

        container.find('[data-asset-selector-validate-field="youtubeId"]').trigger(event);
      });
    });

    describe('event triggered in image description (alt attribute) field', function() {
      beforeEach(function() {
        var payloadUrl = 'https://validurl.com/image.png';
        var payloadDocumentId = '12345';

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });

        dispatcher.dispatch({
          action: Actions.FILE_UPLOAD_DONE,
          url: payloadUrl,
          documentId: payloadDocumentId
        });
      });

      it('dispatches an `ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE` action on a input event from the image description input field', function(done) {
        dispatcher.register(function(payload) {
          var action = payload.action;
          assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE);
          assert.equal(payload.altAttribute, 'Hey alt');
          done();
        });

        var altFieldInput = container.find('.asset-selector-alt-text-input');
        var event = $.Event('input'); //eslint-disable-line new-cap

        assert.lengthOf(altFieldInput, 1);

        altFieldInput.val('Hey alt');
        altFieldInput.trigger(event);
      });
    });

    it('dispatches `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` on a viewSelected event for a federated dataset', function(done) {
      dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET);
        // the values will be empty, but assert that the event adds the keys
        assert.propertyVal(payload, 'datasetUid', 'the-id');
        assert.propertyVal(payload, 'domain', 'federate.me');
        assert.propertyVal(payload, 'isNewBackend', true);
        done();
      });

      container.find('.modal-dialog').trigger('viewSelected', {
        id: 'the-id',
        domainCName: 'federate.me',
        newBackend: true
      });
    });

    it('dispatches `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` on a viewSelected event for a non-federated dataset', function(done) {
      dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET);
        // the values will be empty, but assert that the event adds the keys
        assert.propertyVal(payload, 'datasetUid', 'the-id');
        assert.propertyVal(payload, 'domain', window.location.hostname);
        assert.propertyVal(payload, 'isNewBackend', true);
        done();
      });

      container.find('.modal-dialog').trigger('viewSelected', {
        id: 'the-id',
        domainCName: undefined, // yes, it comes back as undefined from the dataset picker.
        newBackend: true
      });
    });

    it('dispatches `ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART` on a mapOrChartSelected event', function(done) {
      dispatcher.register(function(payload) {
        var action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART);
        // the values will be empty, but assert that the event adds the keys
        assert.propertyVal(payload, 'mapOrChartUid', 'mapc-hart');
        assert.propertyVal(payload, 'domain', window.location.hostname);
        done();
      });

      container.find('.modal-dialog').trigger('mapOrChartSelected', {
        id: 'mapc-hart',
        domainCName: undefined
      });
    });

    it('dispatches `ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION` on a visualizationSelected event', function(done) {
      dispatcher.register(function(payload) {
        if (payload.action === Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION) {
          // the values will be empty, but assert that the event adds the correct keys
          assert.property(payload, 'visualization');
          assert.property(payload.visualization, 'format');
          done();
        }
      });

      assetSelectorStoreMock.addChangeListener(_.once(function() {
        container.find('.modal-dialog').trigger('visualizationSelected', {format: 'vif', data: {}});
      }));

      // add dataset so the proper component values are there for updating
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
        datasetUid: StandardMocks.validStoryUid,
        domain: 'example.com',
        isNewBackend: true
      });

      server.respond([
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          id: 'fooo-baar',
          newBackend: true,
          domain: 'foo',
          columns: [{
            'fieldName': 'foo'
          }]
        })
      ]);
    });

    xdescribe('select file in image upload', function() {
      var cancelSpy;
      var uploadSpy;
      var mockFile = {
        name: 'fake-file.png',
        type: 'image/png',
        size: 1024 * 2
      };

      beforeEach(function() {
        cancelSpy = sinon.spy();
        uploadSpy = sinon.spy();

        AssetSelectorRendererAPI.__Rewire__('fileUploader', {
          cancel: cancelSpy,
          upload: uploadSpy
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        });
      });

      afterEach(function() {
        AssetSelectorRendererAPI.__ResetDependency__('fileUploader');
      });

      it('verifies a file is selected before starting an upload', function() {
        container.find('[data-asset-selector-validate-field="imageUpload"]').trigger('change', { target: { files: [] }});
        assert.isFalse(cancelSpy.called);
        assert.isFalse(uploadSpy.called);
      });

      it('starts uploading the selected file', function() {
        container.find('[data-asset-selector-validate-field="imageUpload"]').trigger('change', { target: { files: [mockFile] }});
        assert.isTrue(cancelSpy.called);
        assert.isTrue(uploadSpy.called);
      });
    });
  });

  describe('when rendering', function() {
    beforeEach(function() {
      new AssetSelectorRenderer(options); //eslint-disable-line no-new
    });

    it('renders the "choose provider" content on an `ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT` event', function() {

      dispatcher.dispatch({
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

    it('renders an image preview with a description (alt attribute) container', function() {
      var payloadUrl = 'https://validurl.com/image.png';
      var payloadDocumentId = '12345';

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'IMAGE'
      });

      dispatcher.dispatch({
        action: Actions.FILE_UPLOAD_DONE,
        url: payloadUrl,
        documentId: payloadDocumentId
      });

      assert.equal(container.find('.asset-selector-image-description-container').length, 1);
      assert.equal(container.find('.asset-selector-alt-text-input').length, 1);
      assert.equal(container.find('.asset-selector-image-description-label').length, 1);
      assert.equal(container.find('.asset-selector-image-alt-hint').length, 1);
    });

    it('renders the "choose YouTube" content on an appropriate `ASSET_SELECTOR_PROVIDER_CHOSEN` event', function() {
      dispatcher.dispatch({
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
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');
    });

    it('renders the YouTube preview in the invalid state when an invalid YouTube url has been supplied', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val('invalid');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: 'invalid'
      });

      assert.isTrue(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src'), 'about:blank');
    });

    it('renders the YouTube preview with the iframe source set to the url when a valid YouTube video url has been supplied', function() {
      var rickRoll = 'https://youtu.be/dQw4w9WgXcQ';

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val(rickRoll);

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
    });

    it('renders the YouTube preview with the iframe source set to the url when valid YouTube embed code has been supplied', function() {
      var rickRoll = '<iframe width="420" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>';

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'YOUTUBE'
      });

      container.find('[data-asset-selector-validate-field="youtubeId"]').val(rickRoll);

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
        url: rickRoll
      });

      assert.isFalse(container.find('.asset-selector-preview-container').hasClass('invalid'));
      assert.equal(container.find('iframe').attr('src').match(/dQw4w9WgXcQ/).length, 1);
    });

    it('closes the modal on an `ASSET_SELECTOR_CLOSE` event', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex
      });

      assert.isFalse(container.hasClass('hidden'));

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });

      assert.isTrue(container.hasClass('hidden'));
    });

    describe('an `ASSET_SELECTOR_PROVIDER_CHOSEN` action with provider = SOCRATA_VISUALIZATION is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'SOCRATA_VISUALIZATION'
        });
      });

      it('renders visualziation options', function() {
        assert.equal(container.find('.visualization-options').length, 1);
        assert.equal(container.find('[data-visualization-option="INSERT_VISUALIZATION"]').length, 1);
        assert.equal(container.find('[data-visualization-option="CREATE_VISUALIZATION"]').length, 1);
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
      });
    });

    describe('an `ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN` action with visualizationOption = INSERT_VISUALIZATION is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'INSERT_VISUALIZATION'
        });
      });

      it('renders an iframe', function() {
        assert.equal(container.find('.asset-selector-mapOrChart-chooser-iframe').length, 1);
      });

      describe('the iframe', function() {
        it('has the correct source', function() {
          var iframeSrc = decodeURI(container.find('iframe').attr('src'));
          assert.include(iframeSrc, 'browse/select_dataset');
          assert.include(iframeSrc, 'filtered_types[]=maps&filtered_types[]=charts');
          assert.include(iframeSrc, 'limitTo[]=charts&limitTo[]=maps&limitTo[]=blob');
        });
      });

      describe('the modal', function() {
        it('has the wide class to display the iframe', function() {
          assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
        });

        it('has a modal title loading spinner', function() {
          assert.lengthOf(container.find('.btn-busy:not(.hidden)'), 1);
        });

        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_VISUALIZATION_OPTION"]'),
            1
          );
        });
      });
    });

    describe('an `ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN` action with visualizationOption = INSERT_TABLE is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'INSERT_TABLE'
        });
      });

      it('renders an iframe', function() {
        assert.equal(container.find('.asset-selector-dataset-chooser-iframe').length, 1);
      });

      describe('the iframe', function() {
        it('has the correct source', function() {
          var iframeSrc = decodeURI(container.find('iframe').attr('src'));
          assert.include(iframeSrc, 'browse/select_dataset');
          assert.include(iframeSrc, 'suppressed_facets[]=type');
          assert.include(iframeSrc, 'limitTo=tables');
        });
      });

      describe('the modal', function() {
        it('has the wide class to display the iframe', function() {
          assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
        });

        it('has a modal title loading spinner', function() {
          assert.lengthOf(container.find('.btn-busy:not(.hidden)'), 1);
        });

        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_VISUALIZATION_OPTION"]'),
            1
          );
        });
      });

      describe('an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action is fired', function() {
        var tableStub;
        beforeEach(function(done) {
          tableStub = sinon.stub($.fn, 'componentSocrataVisualizationTable', _.noop);

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: StandardMocks.validStoryUid,
            domain: 'example.com',
            isNewBackend: true
          });

          server.respond([
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({
              id: 'fooo-baar',
              newBackend: true,
              domain: 'foo',
              columns: [{
                'fieldName': 'foo'
              }]
            })
          ]);

          //Wait for promises in AssetSelectorStore
          setTimeout(function() { done(); }, 10);
        });

        afterEach(function() {
          tableStub.restore();
        });

        it('previews the table', function() {
          sinon.assert.called(tableStub);
          var componentData = tableStub.args[0][0];
          assert.propertyVal(componentData, 'type', 'socrata.visualization.table');
          assert.propertyVal(componentData.value.vif, 'type', 'table');
          assert.propertyVal(componentData.value.vif, 'domain', 'example.com');
          assert.propertyVal(componentData.value.vif, 'datasetUid', 'fooo-baar');
        });

        it('has an enabled insert button', function() {
          assert.isFalse(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });

    describe('an `ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN` action with visualizationOption = CREATE_VISUALIZATION is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'CREATE_VISUALIZATION'
        });
      });

      it('renders an iframe', function() {
        assert.equal(container.find('.asset-selector-dataset-chooser-iframe').length, 1);
      });

      describe('the iframe', function() {
        it('has the correct source', function() {
          var iframeSrc = decodeURI(container.find('iframe').attr('src'));
          assert.include(iframeSrc, 'browse/select_dataset');
          assert.include(iframeSrc, 'suppressed_facets[]=type');
          assert.include(iframeSrc, 'limitTo=datasets');
        });
      });

      describe('the modal', function() {
        it('has the wide class to display the iframe', function() {
          assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
        });

        it('has a modal title loading spinner', function() {
          assert.lengthOf(container.find('.btn-busy:not(.hidden)'), 1);
        });

        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_VISUALIZATION_OPTION"]'),
            1
          );
        });
      });

      describe('an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action is fired', function() {
        beforeEach(function(done) {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: StandardMocks.validStoryUid,
            domain: 'example.com',
            isNewBackend: true
          });

          server.respond([
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify({
              id: 'fooo-baar',
              newBackend: true,
              domain: 'foo',
              columns: [{
                'fieldName': 'foo'
              }]
            })
          ]);

          //Wait for promises in AssetSelectorStore
          setTimeout(function() { done(); }, 10);
        });

        describe('then `ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP` is fired', function() {
          beforeEach(function() {
            dispatcher.dispatch({
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

            describe('onVisualizationSelected on the iframe', function() {
              var iframe;
              var selectedVisualization = { visualization: 'blob' };

              beforeEach(function() {
                iframe = container.find('iframe')[0];
              });

              it('has a onVisualizationSelectedV2 function on it', function() {
                assert.isFunction(iframe.onVisualizationSelectedV2);
              });

              it('dispatches ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION', function(done) {
                dispatcher.register(function(payload) {
                  if (payload.action === Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION) {
                    assert.deepEqual(payload.visualization.data, selectedVisualization);
                    assert.deepPropertyVal(payload, 'visualization.format', 'classic');
                    assert.deepPropertyVal(payload, 'visualization.originalUid', 'orig-inal');
                    done();
                  }
                });

                iframe.onVisualizationSelectedV2(JSON.stringify(selectedVisualization), 'classic', 'orig-inal');
              });

              it('does not preserve the object constructor (because in IE, the constructor will break on iframe unload)', function(done) {
                function StrangeConstructor() {}
                var objectWithStrangeConstructor = new StrangeConstructor();

                dispatcher.register(function(payload) {
                  if (payload.action === Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION) {
                    assert.notInstanceOf(payload.visualization.data, StrangeConstructor);
                    done();
                  }
                });

                iframe.onVisualizationSelectedV2(JSON.stringify(objectWithStrangeConstructor), 'classic', 'orig-inal');
              });
            });

            describe('onVisualizationSelectedV2 on the iframe', function() {
              var iframe;
              var selectedVisualizationJson = JSON.stringify({ visualization: 'blob' });

              beforeEach(function() {
                iframe = container.find('iframe')[0];
              });

              it('has a onVisualizationSelectedV2 function on it', function() {
                assert.isFunction(iframe.onVisualizationSelectedV2);
              });

              it('dispatches ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION', function(done) {
                dispatcher.register(function(payload) {
                  if (payload.action === Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION) {
                    assert.deepEqual(payload.visualization.data, JSON.parse(selectedVisualizationJson));
                    assert.deepPropertyVal(payload, 'visualization.format', 'classic');
                    assert.deepPropertyVal(payload, 'visualization.originalUid', 'orig-inal');
                    done();
                  }
                });

                iframe.onVisualizationSelectedV2(selectedVisualizationJson, 'classic', 'orig-inal');
              });
            });
          });

          describe('the modal', function() {
            it('has a close button', function() {
              assert.equal(container.find('.modal-close-btn').length, 1);
            });

            it('has the wide class to display the iframe', function() {
              assert.include(container.find('.modal-dialog').attr('class'), 'modal-dialog-wide');
            });

            it('has a button that goes back to the dataset picker', function() {
              assert.equal(
                container.find('[data-resume-from-step]').attr('data-resume-from-step'),
                'SELECT_DATASET_FOR_VISUALIZATION'
              );
            });
          });
        });
      });
    });

    describe('an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART` action is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
          domain: 'example.com',
          mapOrChartUid: 'mapc-hart'
        });
      });

      it('has a button that goes to the map or chart visualization page', function() {
        assert.equal(assetSelectorStoreMock.getStep(), WIZARD_STEP.CONFIGURE_MAP_OR_CHART);
      });
    });

    describe('an `ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD` action is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });

        dispatcher.dispatch({
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

        it('has two buttons that go back to the provider list', function() {
          assert.lengthOf(
            container.find('[data-resume-from-step="SELECT_ASSET_PROVIDER"]'),
            2
          );
        });

        it('has a disabled insert button', function() {
          assert.isTrue(
            container.find('.btn-apply').prop('disabled')
          );
        });
      });
    });

    describe('a `FILE_UPLOAD_PROGRESS` action is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });

        dispatcher.dispatch({
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

    describe('a `FILE_UPLOAD_ERROR` action is fired', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });

        dispatcher.dispatch({
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

    describe('a `FILE_UPLOAD_DONE` action is fired', function() {
      var imageUrl = 'https://media.giphy.com/media/I8BOASC4LS0rS/giphy.gif';
      var documentId = 9876;
      var imgEl;

      ['IMAGE', 'HERO', 'AUTHOR'].map(function(provider) {
        describe(StorytellerUtils.format('while editing component type: {0}', provider), function() {
          beforeEach(function() {
            var blockId;

            if (provider === 'IMAGE') {
              blockId = StandardMocks.imageBlockId;
            } else if (provider === 'HERO') {
              blockId = StandardMocks.heroBlockId;
            } else if (provider === 'AUTHOR') {
              blockId = StandardMocks.authorBlockId;
            }

            dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
              blockId: blockId,
              componentIndex: 0
            });
          });

          beforeEach(function() {
            dispatcher.dispatch({
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
  });
});
