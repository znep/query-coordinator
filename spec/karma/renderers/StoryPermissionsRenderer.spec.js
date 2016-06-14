import $ from 'jQuery';
import _ from 'lodash';

import I18nMocker from '../I18nMocker';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import StoryPermissionsRenderer, {__RewireAPI__ as StoryPermissionsRendererAPI} from 'editor/renderers/StoryPermissionsRenderer';

describe('StoryPermissionsRenderer', function() {

  // Template Variables
  var dispatcher;
  var storyPermissionsManager;
  var isPublic;
  var storyDigest;
  var publishedStoryDigest;
  var $settingsPanelPublishing;
  var $visibilityLabel;
  var $visibilityButton;
  var $visibilityButtonText;
  var $updatePublicLabel;
  var $updatePublicButton;
  var $publishingHelpText;
  var $errorContainer;
  var $settingsPanel;

  function buildAndCleanTemplate() {
    beforeEach(function() {
      var $settingsPanelStoryStatus;

      $settingsPanelPublishing = $('<div>', {'class': 'settings-panel-publishing'});
      $settingsPanelStoryStatus = $('<div>', {'class': 'settings-panel-story-status'});

      var $settingsPanelStoryVisibility = $('<div>', {'class': 'settings-panel-story-visibility'});

      $visibilityLabel = $('<h3>');
      $visibilityButton = $('<button>');
      $visibilityButtonText = $('<span>');
      $visibilityButton.append($visibilityButtonText);

      $settingsPanelStoryVisibility.append($visibilityLabel);
      $settingsPanelStoryVisibility.append($visibilityButton);

      $settingsPanelStoryStatus = $('<div>', {'class': 'settings-panel-story-status'});

      $updatePublicLabel = $('<h3>');
      $updatePublicButton = $('<button>');

      $settingsPanelStoryStatus.append($updatePublicLabel);
      $settingsPanelStoryStatus.append($updatePublicButton);

      $publishingHelpText = $('<div>', {'class': 'settings-panel-story-publishing-help-text'});

      $settingsPanel = $('<div>', {'class': 'settings-panel'});

      $errorContainer = $('<div>', {'class': 'settings-panel-errors'});

      $settingsPanel.append($errorContainer);

      $settingsPanelPublishing.append($settingsPanelStoryStatus);
      $settingsPanelPublishing.append($settingsPanelStoryVisibility);
      $settingsPanelPublishing.append($settingsPanelStoryStatus);
      $settingsPanelPublishing.append($publishingHelpText);

      $('body').append($settingsPanelPublishing);
      $('body').append($settingsPanel);
    });

    afterEach(function() {
      $settingsPanelPublishing.remove();
      $settingsPanel.remove();
    });
  }

  function stubStoryPermissionsManager() {
    beforeEach(function() {
      storyPermissionsManager = {
        makePublic: sinon.stub(),
        makePrivate: sinon.stub()
      };

      StoryPermissionsRendererAPI.__Rewire__(
        'storyPermissionsManager',
        storyPermissionsManager
      );
    });

    afterEach(function() {
      StoryPermissionsRendererAPI.__ResetDependency__(
        'storyPermissionsManager'
      );
    });
  }

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.getStoryPermissions = function() {
        return {isPublic: isPublic};
      };

      this.getStoryPublishedStory = function() {
        return {digest: publishedStoryDigest};
      };

      this.getStoryDigest = function() {
        return storyDigest;
      };
    };

    StoryPermissionsRendererAPI.__Rewire__('storyStore', new StoryStoreMock());
    StoryPermissionsRendererAPI.__Rewire__('I18n', I18nMocker);
    StoryPermissionsRendererAPI.__Rewire__('Environment', {
      STORY_UID: 'four-four',
      CURRENT_USER_STORY_AUTHORIZATION: {
        domainRights: ['manage_story_public_version'],
        viewRole: 'owner'
      }
    });
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    StoryPermissionsRendererAPI.__ResetDependency__('storyStore');
    StoryPermissionsRendererAPI.__ResetDependency__('I18n');
    StoryPermissionsRendererAPI.__ResetDependency__('Environment');
  });

  describe('constructor', function() {
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

          describe('and has a difference in digest', function() {
            beforeEach(function() {
              storyDigest = 'digest';
              publishedStoryDigest = 'new-digest';
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
    stubStoryPermissionsManager();

    describe('when the story is public', function() {
      beforeEach(function() {
        isPublic = false;
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('attempts to make a call to StoryPermissionsManager to make the story public', function() {
        $visibilityButton.click();

        assert(storyPermissionsManager.makePublic.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Excepted the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });

    describe('when the story is private', function() {
      beforeEach(function() {
        isPublic = true;
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('attempts to make a call to StoryPermissionsManager to make the story private', function() {
        $visibilityButton.click();

        assert(storyPermissionsManager.makePrivate.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Excepted the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });
  });

  describe('updatePublicButton', function() {
    buildAndCleanTemplate();
    stubStoryPermissionsManager();

    describe('when the story is public', function() {
      beforeEach(function() {
        isPublic = true;
        publishedStoryDigest = 'new-digest';

        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('attempts to update the published story', function() {
        assert.isFalse($updatePublicButton.prop('disabled'));

        $updatePublicButton.click();

        assert(storyPermissionsManager.makePublic.called);
        assert($updatePublicButton.hasClass('btn-busy'), 'Excepted the update button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });

    describe('when the story is private', function() {
      beforeEach(function() {
        isPublic = false;
        new StoryPermissionsRenderer(); //eslint-disable-line no-new
      });

      it('renders the update button in a disabled state', function() {
        assert($updatePublicButton.prop('disabled'), 'updatePublic button should be disabled');

        $updatePublicButton.click();

        assert(storyPermissionsManager.makePublic.notCalled, 'makePublic should not be called');
      });
    });
  });
});

