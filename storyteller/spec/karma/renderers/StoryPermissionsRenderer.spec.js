import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { FeatureFlags } from 'common/feature_flags';

import I18nMocker from '../I18nMocker';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import StoryPermissionsRenderer, {__RewireAPI__ as StoryPermissionsRendererAPI} from 'editor/renderers/StoryPermissionsRenderer';

const assetUtils = require('common/asset/utils');

describe('StoryPermissionsRenderer', function() {

  // Template Variables
  let dispatcher;
  let storyPermissionsManager;
  let isPublic;
  let isDraftUnpublished;
  let canPublishCurrentStory;
  let $settingsPanelPublishing;
  let $visibilityLabel;
  let $visibilityButton;
  let $visibilityButtonText;
  let $updatePublicLabel;
  let $updatePublicButton;
  let $publishingHelpText;
  let $errorContainer;
  let $settingsPanel;

  function buildAndCleanTemplate() {
    beforeEach(function() {
      // Build settingsPanelPublishing
      const $settingsPanelStoryStatus = $('<div>', {'class': 'settings-panel-story-status'});
      const $settingsPanelStoryVisibility = $('<div>', {'class': 'settings-panel-story-visibility'});

      $visibilityLabel = $('<h3>');
      $visibilityButton = $('<button>');
      $visibilityButtonText = $('<span>');
      $visibilityButton.append($visibilityButtonText);

      $settingsPanelStoryVisibility.append($visibilityLabel);
      $settingsPanelStoryVisibility.append($visibilityButton);

      $updatePublicLabel = $('<h3>');
      $updatePublicButton = $('<button>');

      $settingsPanelStoryStatus.append($updatePublicLabel);
      $settingsPanelStoryStatus.append($updatePublicButton);

      $publishingHelpText = $('<div>', {'class': 'settings-panel-story-publishing-help-text'});

      $settingsPanelPublishing = $('<div>', {'class': 'settings-panel-publishing'});
      $settingsPanelPublishing.append($settingsPanelStoryStatus);
      $settingsPanelPublishing.append($settingsPanelStoryVisibility);
      $settingsPanelPublishing.append($publishingHelpText);

      // Build $settingsPanel
      $settingsPanel = $('<div>', {'class': 'settings-panel'});

      $errorContainer = $('<div>', {'class': 'settings-panel-errors'});

      $settingsPanel.append($errorContainer);

      // Attach to body
      $('body').append($settingsPanelPublishing);
      $('body').append($settingsPanel);
    });

    afterEach(function() {
      $settingsPanelPublishing.remove();
      $settingsPanel.remove();
    });
  }

  function stubApprovalMessage() {
    let assetWillEnterApprovalsQueueWhenMadePublicStub;

    beforeEach(() => {
      assetWillEnterApprovalsQueueWhenMadePublicStub = sinon.
        stub(assetUtils, 'assetWillEnterApprovalsQueueWhenMadePublic').
        returns(Promise.resolve(false));
    });

    afterEach(() => {
      assetWillEnterApprovalsQueueWhenMadePublicStub.restore();
    });
  }

  beforeEach(function() {
    FeatureFlags.useTestFixture({
      use_fontana_approvals: true
    });

    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    const mockEnvironment = {
      STORY_UID: 'four-four'
    };

    storyPermissionsManager = {
      makePublic: sinon.stub(),
      makePrivate: sinon.stub()
    };

    const StoryStoreMock = function() {
      _.extend(this, new Store());
      this.doesStoryExist = _.constant(true);
      this.isStoryPublic = () => isPublic;
      this.isDraftUnpublished = () => isDraftUnpublished;
    };

    const PermissionStoreMock = function() {
      _.extend(this, new Store());
      this.canPublishCurrentStory = () => canPublishCurrentStory;
    };

    StoryPermissionsRendererAPI.__Rewire__('I18n', I18nMocker);
    StoryPermissionsRendererAPI.__Rewire__('Environment', mockEnvironment);
    StoryPermissionsRendererAPI.__Rewire__('storyPermissionsManager', storyPermissionsManager);
    StoryPermissionsRendererAPI.__Rewire__('permissionStore', new PermissionStoreMock());
    StoryPermissionsRendererAPI.__Rewire__('storyStore', new StoryStoreMock());
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    StoryPermissionsRendererAPI.__ResetDependency__('I18n');
    StoryPermissionsRendererAPI.__ResetDependency__('Environment');
    StoryPermissionsRendererAPI.__ResetDependency__('storyPermissionsManager');
    StoryPermissionsRendererAPI.__ResetDependency__('permissionStore');
    StoryPermissionsRendererAPI.__ResetDependency__('storyStore');
  });

  describe('constructor', function() {
    stubApprovalMessage();

    describe('when instantiated', function() {
      describe('with no arguments and a missing publishing DOM element', function() {
        it('raises an exception', function() {
          assert.throws(function() {
            new StoryPermissionsRenderer(); //eslint-disable-line no-new
          });
        });
      });

      describe('with no arguments and an available publishing DOM element', function() {
        buildAndCleanTemplate();

        beforeEach(function() {
          canPublishCurrentStory = true;
        });

        describe('with a story that is currently public', function() {
          beforeEach(function() {
            isPublic = true;
          });

          it('renders', function() {
            new StoryPermissionsRenderer(); //eslint-disable-line no-new

            assert.equal($visibilityLabel.text(), I18nMocker.t('editor.settings_panel.publishing_section.visibility.public'));
            assert.equal($visibilityButtonText.text(), I18nMocker.t('editor.settings_panel.publishing_section.visibility.make_story_private'));
            assert($visibilityButton.hasClass('btn-default'));
            assert(!$visibilityButton.hasClass('btn-alternate-2'));
            assert.equal($updatePublicButton.prop('disabled'), true);
            assert.equal($updatePublicLabel.text(), I18nMocker.t('editor.settings_panel.publishing_section.status.published'));
            assert.equal($publishingHelpText.text(), I18nMocker.t('editor.settings_panel.publishing_section.messages.has_been_published'));
          });

          describe('and has diverged from the published story', function() {
            beforeEach(function() {
              isDraftUnpublished = true;
            });

            it('renders', function() {
              new StoryPermissionsRenderer(); //eslint-disable-line no-new

              assert.equal($updatePublicButton.prop('disabled'), false);
              assert.equal($publishingHelpText.text(), I18nMocker.t('editor.settings_panel.publishing_section.messages.previously_published'));
              assert.equal($updatePublicLabel.text(), I18nMocker.t('editor.settings_panel.publishing_section.status.draft'));
            });
          });
        });

        describe('with a story that is currently private', function() {
          beforeEach(function() {
            isPublic = false;
          });

          it('renders', function() {
            new StoryPermissionsRenderer(); //eslint-disable-line no-new

            assert.equal($visibilityLabel.text(), I18nMocker.t('editor.settings_panel.publishing_section.visibility.private'));
            assert.equal($visibilityButtonText.text(), I18nMocker.t('editor.settings_panel.publishing_section.visibility.make_story_public'));
            assert.isTrue($visibilityButton.hasClass('btn-alternate-2'));
            assert.equal($updatePublicButton.prop('disabled'), true);
            assert.equal($publishingHelpText.text(), I18nMocker.t('editor.settings_panel.publishing_section.messages.can_be_shared_publicly'));
          });
        });
      });
    });
  });

  describe('visibilityButton', function() {
    buildAndCleanTemplate();
    stubApprovalMessage();

    describe('when the story is public', function() {
      beforeEach(function() {
        isPublic = true;
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('calls StoryPermissionsManager.makePrivate on click', function() {
        $visibilityButton.click();

        assert(storyPermissionsManager.makePrivate.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Expected the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Expected the error container to have a class, .hidden');
      });
    });

    describe('when the story is private', function() {
      beforeEach(function() {
        isPublic = false;
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('calls StoryPermissionsManager.makePublic on click', function() {
        $visibilityButton.click();

        assert(storyPermissionsManager.makePublic.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Expected the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Expected the error container to have a class, .hidden');
      });
    });
  });

  describe('updatePublicButton', function() {
    buildAndCleanTemplate();
    stubApprovalMessage();

    describe('when the user lacks permission to publish', function() {
      beforeEach(function() {
        canPublishCurrentStory = false;
      });

      it('renders the update button in a disabled state', function() {
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
        assert.isTrue($updatePublicButton.prop('disabled'), 'Expected updatePublic button to be disabled');

        $updatePublicButton.click();

        assert(storyPermissionsManager.makePublic.notCalled, 'Expected makePublic not to be called');
      });
    });

    describe('when the story is public', function() {
      beforeEach(function() {
        isPublic = true;
        isDraftUnpublished = true;
        canPublishCurrentStory = true;
      });

      it('attempts to update the published story', function() {
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
        assert.isFalse($updatePublicButton.prop('disabled'), 'Expected updatePublic button not to be disabled');

        $updatePublicButton.click();

        assert(storyPermissionsManager.makePublic.called, 'Expected makePublic to be called');
        assert($updatePublicButton.hasClass('btn-busy'), 'Expected the update button to have class .busy');
        assert($errorContainer.hasClass('hidden'), 'Expected the error container to have class .hidden');
      });
    });

    describe('when the story is private', function() {
      beforeEach(function() {
        isPublic = false;
        canPublishCurrentStory = true;
      });

      it('renders the update button in a disabled state', function() {
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
        assert.isTrue($updatePublicButton.prop('disabled'), 'Expected updatePublic button to be disabled');

        $updatePublicButton.click();

        assert(storyPermissionsManager.makePublic.notCalled, 'Expected makePublic not to be called');
      });
    });
  });
});
