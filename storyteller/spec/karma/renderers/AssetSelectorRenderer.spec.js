import $ from 'jquery';
import _ from 'lodash';
import React, { Component } from 'react';

import { FeatureFlags } from 'common/feature_flags';

import { $transient } from '../TransientElement';
import StandardMocks from '../StandardMocks';
import story from '../fixtures/Story';

import StorytellerUtils from 'StorytellerUtils';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import AssetSelectorRenderer, {__RewireAPI__ as AssetSelectorRendererAPI} from 'editor/renderers/AssetSelectorRenderer';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import AssetSelectorStore, {__RewireAPI__ as AssetSelectorStoreAPI, WIZARD_STEP} from 'editor/stores/AssetSelectorStore';
import {STATUS} from 'editor/stores/FileUploaderStore';
import FileUploaderStoreMocker from '../mocks/FileUploaderStoreMocker';
import StoryStoreMocker from '../mocks/StoryStoreMocker';
import I18nMocker from '../I18nMocker';

describe('AssetSelectorRenderer', function() {

  var assetSelectorStoreMock;
  var fileUploaderStoreMock;
  var container;
  var dispatcher;
  var options;
  var testBlockId = 'testBlock1';
  var testComponentIndex = 1;
  var storyStoreMock;
  var server;
  var nbeView = {
    'id': StandardMocks.validStoryUid,
    'name': 'nbe',
    'displayType': 'table',
    'domain': 'example.com',
    'domainCName': 'example.com',
    'newBackend': true,
    'viewType': 'tabular',
    'query': {},
    'columns': [{
      'fieldName': 'foo'
    }]
  };

  class CommonAssetSelectorMock extends Component {
    static lastProps;

    render() {
      CommonAssetSelectorMock.lastProps = this.props;
      return <div className="mock-common-asset-selector" />;
    }
  }

  beforeEach(function() {
    FeatureFlags.useTestFixture({
      enable_getty_images_gallery: true,
      enable_filtered_tables_in_ax: false,
      enable_new_maps: false
    });

    server = sinon.fakeServer.create();

    container = $('<div>', { 'class': 'asset-selector-container' });
    $transient.append(container);

    options = {
      assetSelectorContainerElement: $transient.find('.asset-selector-container')
    };

    dispatcher = new Dispatcher();

    fileUploaderStoreMock = FileUploaderStoreMocker.create({
      properties: {
        fileById: _.constant({status: STATUS.COMPLETED, raw: {name: 'hello.jpg'}, resource: {url: 'https://media.giphy.com/media/I8BOASC4LS0rS/giphy.gif'}})
      }
    });

    storyStoreMock = StoryStoreMocker.create({
      properties: {
        getBlockComponentAtIndex: _.constant({ type: 'image' })
      }
    });

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorStoreAPI.__Rewire__('fileUploaderStore', fileUploaderStoreMock);
    AssetSelectorStoreAPI.__Rewire__('storyStore', storyStoreMock);

    assetSelectorStoreMock = new AssetSelectorStore();

    AssetSelectorRendererAPI.__Rewire__('dispatcher', dispatcher);
    AssetSelectorRendererAPI.__Rewire__('assetSelectorStore', assetSelectorStoreMock);
    AssetSelectorRendererAPI.__Rewire__('I18n', I18nMocker);

    // This is mocking the common asset selector component found in common/components/AssetSelector,
    // not to be confused with AssetSelectorRenderer or AssetSelectorStore in storyteller.
    AssetSelectorRendererAPI.__Rewire__('AssetSelector', CommonAssetSelectorMock);

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
    AssetSelectorRendererAPI.__ResetDependency__('AssetSelector');

    CommonAssetSelectorMock.lastProps = null;
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

    describe('event triggered in youtube title field', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'YOUTUBE'
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
          url: 'https://youtu.be/m86ae_e_ptU'
        });
      });

      it('dispatches an `ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE` action on an input event from the youtube title input field', function(done) {
        dispatcher.register(function(payload) {
          var action = payload.action;
          assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE);
          assert.equal(payload.titleAttribute, '');
          done();
        });

        var event = $.Event('input'); //eslint-disable-line new-cap

        container.find('.asset-selector-title-input').trigger(event);
      });
    });

    describe('event triggered in embedded html title field', function() {
      var isUploadingFileStub;
      var isHTMLFragmentStub;
      var fileByIdStub;

      beforeEach(function() {
        // lotsa stubs!
        isUploadingFileStub = sinon.stub(assetSelectorStoreMock, 'isUploadingFile', _.constant(true));
        isHTMLFragmentStub = sinon.stub(assetSelectorStoreMock, 'isHTMLFragment', _.constant(true));
        fileByIdStub = sinon.stub(
          fileUploaderStoreMock,
          'fileById',
          _.constant({raw: true, status: STATUS.COMPLETED, resource: {}})
        );

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'EMBED_CODE'
        });

        fileUploaderStoreMock._emitChange();
      });

      afterEach(function() {
        isUploadingFileStub.reset();
        isHTMLFragmentStub.reset();
        fileByIdStub.reset();
      });

      it('dispatches an `ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE` action on an input event from the embedded html title input field', function(done) {
        dispatcher.register(function(payload) {
          var action = payload.action;
          assert.equal(action, Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE);
          assert.equal(payload.titleAttribute, '');
          done();
        });

        var event = $.Event('input'); //eslint-disable-line new-cap

        container.find('.asset-selector-title-input').trigger(event);
      });
    });

    describe('event triggered in image description (alt attribute) field', function() {
      var getComponentValueStub;

      beforeEach(function() {
        getComponentValueStub = sinon.stub(assetSelectorStoreMock, 'getComponentValue', _.constant({}));

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          provider: 'IMAGE'
        });

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.IMAGE_PREVIEW
        });

        fileUploaderStoreMock._emitChange();
      });

      afterEach(function() {
        getComponentValueStub.reset();
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

    it('dispatches `ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET` when new window checkbox is clicked', function(done) {
      sinon.stub(assetSelectorStoreMock, 'getComponentType', _.constant('image'));
      sinon.stub(assetSelectorStoreMock, 'getComponentValue', _.constant({}));

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.IMAGE_PREVIEW
      });

      dispatcher.register(function(payload) {
        const action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET);
        done();
      });

      container.find('#open-image-in-new-window').trigger('change');
    });

    it('dispatches `ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET` when new window checkbox is clicked', function(done) {
      sinon.stub(assetSelectorStoreMock, 'getComponentType', _.constant('story.tile'));
      sinon.stub(assetSelectorStoreMock, 'getComponentValue', _.constant({}));

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.ENTER_STORY_URL
      });

      dispatcher.register(function(payload) {
        const action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET);
        done();
      });

      container.find('#open-story-in-new-window').trigger('change');
    });

    it('dispatches `ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET` when new window checkbox is clicked', function(done) {
      sinon.stub(assetSelectorStoreMock, 'getComponentType', _.constant('goal.tile'));
      sinon.stub(assetSelectorStoreMock, 'getComponentValue', _.constant({}));

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.ENTER_GOAL_URL
      });

      dispatcher.register(function(payload) {
        const action = payload.action;
        assert.equal(action, Actions.ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET);
        done();
      });

      container.find('#open-goal-in-new-window').trigger('change');
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
      var getComponentTypeStub = sinon.stub(assetSelectorStoreMock, 'getComponentType', _.constant('image'));
      var getComponentValueStub = sinon.stub(assetSelectorStoreMock, 'getComponentValue', _.constant({}));

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        initialComponentProperties: {}
      });

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.IMAGE_PREVIEW
      });

      fileUploaderStoreMock._emitChange();

      assert.equal(container.find('.asset-selector-image-description-container').length, 1);
      assert.equal(container.find('.asset-selector-alt-text-input').length, 1);
      assert.equal(container.find('.asset-selector-image-description-label').length, 1);
      assert.equal(container.find('.asset-selector-image-alt-hint').length, 1);

      getComponentTypeStub.reset();
      getComponentValueStub.reset();
    });

    it('renders the "embed HTML" content on an appropriate `ASSET_SELECTOR_PROVIDER_CHOSEN` event', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: testBlockId,
        componentIndex: testComponentIndex,
        provider: 'EMBED_CODE'
      });

      assert.equal(container.find('.modal-title').length, 1);
      assert.equal(container.find('.modal-close-btn').length, 1);
      assert.equal(container.find('.asset-selector-embed-code-title-label').length, 1);
      assert.equal(container.find('.asset-selector-embed-code-title-hint').length, 1);
      assert.equal(container.find('.asset-selector-title-input').length, 1);
      assert.isTrue(container.find('[data-asset-selector-field="embedHtml"]').length > 0);
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
      assert.equal(container.find('.asset-selector-youtube-title-label').length, 1);
      assert.equal(container.find('.asset-selector-youtube-title-hint').length, 1);
      assert.equal(container.find('.asset-selector-title-input').length, 1);
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

      it('renders visualization options', function() {
        assert.lengthOf(container.find('.visualization-options'), 1);
        assert.lengthOf(container.find('[data-visualization-option="INSERT_VISUALIZATION"]'), 1);
        assert.lengthOf(container.find('[data-visualization-option="AUTHOR_VISUALIZATION"]'), 1);
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

    describe('an `ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN` action with visualizationOption = AUTHOR_VISUALIZATION is fired', function() {
      beforeEach(function() {
        $(document.body).append($('<div>', {id: 'common-asset-selector'}));

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'AUTHOR_VISUALIZATION'
        });
      });

      afterEach(function() {
        $('#common-asset-selector').remove();
      });

      describe('AssetSelector props', function() {
        // NOTE: Because of the way these tests are set up, this does NOT cover
        // the path where ENABLE_FILTERED_TABLES_IN_AX is true! Introducing a
        // variant behavior is not straightforward.
        //
        // The only thing that should change is that `datasets` would
        // become `datasets,filters`.
        it('sets baseFilters.assetTypes', function() {
          assert.equal(CommonAssetSelectorMock.lastProps.baseFilters.assetTypes, 'datasets');
        });

        it('sets closeOnSelect', function() {
          assert.isFalse(CommonAssetSelectorMock.lastProps.closeOnSelect);
        });

        it('sets modalFooterChildren', function() {
          assert.equal(CommonAssetSelectorMock.lastProps.modalFooterChildren.props.className, 'common-asset-selector-modal-footer-button-group');
        });

        it('sets showBackButton', function() {
          assert.isFalse(CommonAssetSelectorMock.lastProps.showBackButton);
        });
      });
    });

    describe('when within the Authoring Workflow', function() {
      beforeEach(function() {
        $(document.body).append($('<div>', {id: 'authoring-workflow'}));
        $(document.body).append($('<div>', {id: 'common-asset-selector'}));

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'AUTHOR_VISUALIZATION'
        });
      });

      afterEach(function() {
        $('#authoring-workflow').remove();
        $('#common-asset-selector').remove();
      });

      describe('an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action is fired', function() {
        var confirmStub;

        beforeEach(function() {
          confirmStub = sinon.stub(window, 'confirm').returns(true);

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            viewData: nbeView
          });
        });

        afterEach(function() {
          confirmStub.restore();
        });

        it('should render the AuthoringWorkflow', function() {
          assert.isAbove($('#authoring-workflow *').length, 0);
        });

        describe('when canceling', function() {
          it('should close the modal and asset selection', function(done) {
            $('#authoring-workflow .cancel').click();
            setTimeout(function() {
              assert.equal($('#authoring-workflow *').length, 0);
              done();
            }, 1);
          });
        });

        describe('when jumping back a step', function() {
          it('should render AssetSelector', function(done) {
            $('#authoring-workflow .authoring-back-button').click();
            setTimeout(function() {
              assert.equal($('#authoring-workflow *').length, 0);
              assert.lengthOf($('#common-asset-selector .mock-common-asset-selector'), 1);
              done();
            }, 1);
          });
        });
      });
    });

    describe('an `ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN` action with visualizationOption = INSERT_TABLE is fired', function() {
      beforeEach(function() {
        $(document.body).append($('<div>', {id: 'common-asset-selector'}));

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
          visualizationOption: 'INSERT_TABLE'
        });
      });

      afterEach(function() {
        $('#common-asset-selector').remove();
      });

      describe('AssetSelector props', function() {
        // NOTE: Because of the way these tests are set up, this does NOT cover
        // the path where ENABLE_FILTERED_TABLES_IN_AX is true! Introducing a
        // variant behavior is not straightforward.
        //
        // The only thing that should change is that `datasets` would
        // become `datasets,filters`.
        it('sets baseFilters.assetTypes', function() {
          assert.equal(CommonAssetSelectorMock.lastProps.baseFilters.assetTypes, 'datasets');
        });

        it('sets closeOnSelect', function() {
          assert.isFalse(CommonAssetSelectorMock.lastProps.closeOnSelect);
        });

        it('sets modalFooterChildren', function() {
          assert.equal(CommonAssetSelectorMock.lastProps.modalFooterChildren.props.className, 'common-asset-selector-modal-footer-button-group');
        });

        it('sets showBackButton', function() {
          assert.isFalse(CommonAssetSelectorMock.lastProps.showBackButton);
        });
      });

      // TODO test mocking asset selected
      // TODO test closing assetselector without selecting

      describe('an `ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET` action is fired', function() {
        var tableStub;
        beforeEach(function() {
          tableStub = sinon.stub($.fn, 'componentSocrataVisualizationTable', _.noop);

          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            viewData: nbeView
          });
        });

        afterEach(function() {
          tableStub.restore();
        });

        it('previews the table', function() {
          sinon.assert.called(tableStub);
          var componentData = _.get(tableStub, 'args[0][0].componentData', {});
          assert.propertyVal(componentData, 'type', 'socrata.visualization.table');
          assert.propertyVal(componentData.value.vif, 'type', 'table');
          assert.propertyVal(componentData.value.vif, 'domain', nbeView.domain);
          assert.propertyVal(componentData.value.vif, 'datasetUid', nbeView.id);
        });

        it('has an enabled insert button', function() {
          assert.isFalse(
            container.find('.btn-apply').prop('disabled')
          );
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

    describe('when loading an image', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.IMAGE_UPLOADING
        });
      });

      it('has a spinner', function() {
        var $busy = container.find('.btn-busy');
        assert.lengthOf($busy, 1);
        assert.notInclude($busy.attr('class'), 'hidden');
      });

      it('has a cancel button in the progress pane', function() {
        assert.lengthOf(
          container.find('.asset-selector-cancel-upload'),
          1
        );
      });

      describe('the modal', function() {
        it('has a close button', function() {
          assert.equal(container.find('.modal-close-btn').length, 1);
        });

        it('has a button that goes back to the choose image upload step', function() {
          assert.lengthOf(
            container.find('.back-btn'),
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

    describe('when an image upload fails', function() {
      beforeEach(function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.IMAGE_UPLOAD_ERROR
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
            container.find('.back-btn'),
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

    describe('during an image preview', function() {
      var imageUrl = 'https://media.giphy.com/media/I8BOASC4LS0rS/giphy.gif';
      var imgEl;

      ['IMAGE', 'HERO', 'AUTHOR'].map(function(provider) {
        describe(StorytellerUtils.format('while editing component type: {0}', provider), function() {
          beforeEach(function() {
            var blockId;

            if (provider === 'IMAGE') {
              blockId = StandardMocks.imageBlockId;
              sinon.stub(storyStoreMock, 'getBlockComponentAtIndex', function() {
                return {type: 'image', value: {url: imageUrl}};
              });
            } else if (provider === 'HERO') {
              blockId = StandardMocks.heroBlockId;
              sinon.stub(storyStoreMock, 'getBlockComponentAtIndex', function() {
                return {type: 'hero', value: {url: imageUrl}};
              });
            } else if (provider === 'AUTHOR') {
              blockId = StandardMocks.authorBlockId;
              sinon.stub(storyStoreMock, 'getBlockComponentAtIndex', function() {
                return {type: 'author', value: {image: {url: imageUrl}}};
              });
            }

            dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED,
              blockId: blockId,
              componentIndex: 0
            });
          });

          beforeEach(function() {
            fileUploaderStoreMock._emitChange();
            imgEl = container.find('img');
          });

          it('renders a preview image from the payload URL', function() {
            assert.equal(imgEl.attr('src'), imageUrl);
          });

          describe('the modal', function() {
            it('has a close button', function() {
              assert.equal(container.find('.modal-close-btn').length, 1);
            });

            it('has a button that goes back to the choose image upload step', function() {
              assert.lengthOf(container.find('.image-crop-back-btn'), 1);
            });

            it('has an enabled insert button', function() {
              assert.isFalse(container.find('.image-crop-upload-btn').prop('disabled'));
            });
          });
        });
      });
    });
  });
});
