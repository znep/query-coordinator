describe('StoryPermissionsRenderer', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  var container;
  var options;
  var testBlockId = 'testBlock1';
  var testComponentIndex = 1;
  var StoryPermissionsRenderer;
  var uniqueId = 1000;

  // Template Variables
  var $settingsPanelPublishing;
  var $settingsPanelStoryStatus;
  var $visibilityLabel;
  var $visibilityButton;
  var $visibilityButtonText;
  var $updatePublicLabel;
  var $updatePublicButton;
  var $publishingHelpText;
  var $errorContainer;
  var $settingsPanel;

  function newStory(isPublic) {
    var uid = 'four-' + uniqueId++;
    var sampleStoryData = generateStoryData({
      uid: uid,
      title: 'My Title',
      description: 'My Description',
      theme: 'My Theme',
      digest: 'digest',
      permissions: {isPublic: isPublic ? true : false},
      blocks: [
        generateBlockData({
          id: 'id1' + uniqueId,
          layout: 'notsure',
          components: []
        })
      ]
    });

    window.publishedStory = {digest: 'digest'};
    storyteller.userStoryUid = uid;
    storyteller.dispatcher.dispatch({
      action: Actions.STORY_CREATE,
      data: sampleStoryData
    });

    storyteller.dispatcher.dispatch({
      action: Actions.STORY_SET_PUBLISHED_STORY,
      publishedStory: {digest: 'digest'},
      storyUid: uid
    });
  }

  function buildAndCleanTemplate() {
    beforeEach(function() {
      $settingsPanelPublishing = $('<div>', {'class': 'settings-panel-publishing'});
      $settingsPanelStoryStatus = $('<div>', {'class': 'settings-panel-story-status'});

      var $settingsPanelStoryVisibility = $('<div>', {'class': 'settings-panel-story-visibility'});

      $visibilityLabel = $('<h3>');
      $visibilityButton = $('<button>');
      $visibilityButtonText = $('<span>');
      $visibilityButton.append($visibilityButtonText);

      $settingsPanelStoryVisibility.append($visibilityLabel);
      $settingsPanelStoryVisibility.append($visibilityButton);

      var $settingsPanelStoryStatus = $('<div>', {'class': 'settings-panel-story-status'});

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
      storyteller.storyPermissionsManager = new storyteller.StoryPermissionsManager();
      sinon.stub(storyteller.storyPermissionsManager, 'makePublic');
      sinon.stub(storyteller.storyPermissionsManager, 'makePrivate');
    });

    afterEach(function() {
      storyteller.storyPermissionsManager.makePublic.restore();
      storyteller.storyPermissionsManager.makePrivate.restore();
    });
  }

  beforeEach(function() {
    StoryPermissionsRenderer = storyteller.StoryPermissionsRenderer;
    newStory();
  });

  describe('constructor', function() {
    describe('when instantiated', function() {
      describe('with no arguments and a missing publishing DOM element', function() {
        it('raises an exception', function() {
          assert.throws(function() {
            var instance = new StoryPermissionsRenderer();
          });
        });
      });

      describe('with no arguments and an available publishing DOM element', function() {
        buildAndCleanTemplate();

        describe('with a story that is currently public', function() {
          beforeEach(function() {
            newStory(true);
          });

          it('renders', function() {
            var instance = new StoryPermissionsRenderer();

            assert.equal($visibilityLabel.text(), I18n.t('editor.settings_panel.publishing_section.visibility.public'));
            assert.equal($visibilityButtonText.text(), I18n.t('editor.settings_panel.publishing_section.visibility.make_story_private'));
            assert($visibilityButton.hasClass('btn-default'));
            assert(!$visibilityButton.hasClass('btn-secondary'));
            assert.equal($updatePublicButton.prop('disabled'), true);
            assert.equal($updatePublicLabel.text(), I18n.t('editor.settings_panel.publishing_section.status.published'));
            assert.equal($publishingHelpText.text(), I18n.t('editor.settings_panel.publishing_section.messages.has_been_published'));
          });

          describe('and has a difference in digest', function() {
            beforeEach(function() {
              storyteller.dispatcher.dispatch({
                action: Actions.STORY_SET_PUBLISHED_STORY,
                publishedStory: {digest: 'new-digest'},
                storyUid: storyteller.userStoryUid
              });
            });

            it('renders', function() {
              var instance = new StoryPermissionsRenderer();

              assert.equal($updatePublicButton.prop('disabled'), false);
              assert.equal($publishingHelpText.text(), I18n.t('editor.settings_panel.publishing_section.messages.previously_published'));
              assert.equal($updatePublicLabel.text(), I18n.t('editor.settings_panel.publishing_section.status.draft'));
            });
          });
        });

        describe('with a story that is currently private', function() {
          beforeEach(function() {
            newStory(false);
          });

          it('renders', function() {
            var instance = new StoryPermissionsRenderer();

            assert.equal($visibilityLabel.text(), I18n.t('editor.settings_panel.publishing_section.visibility.private'));
            assert.equal($visibilityButtonText.text(), I18n.t('editor.settings_panel.publishing_section.visibility.make_story_public'));
            assert.isTrue($visibilityButton.hasClass('btn-secondary'));
            assert.equal($updatePublicButton.prop('disabled'), true);
            assert.equal($publishingHelpText.text(), I18n.t('editor.settings_panel.publishing_section.messages.can_be_shared_publically'));
          });
        });
      })
    });
  });

  describe('visibilityButton', function() {
    buildAndCleanTemplate();
    stubStoryPermissionsManager();

    describe('when the story is public', function() {
      beforeEach(function() {
        newStory(false);
        var instance = new StoryPermissionsRenderer();
      });

      it('attempts to make a call to StoryPermissionsManager to make the story public', function() {
        $visibilityButton.click();

        assert(storyteller.storyPermissionsManager.makePublic.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Excepted the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });

    describe('when the story is private', function() {
      beforeEach(function() {
        newStory(true);
        var instance = new StoryPermissionsRenderer();
      });

      it('attempts to make a call to StoryPermissionsManager to make the story private', function() {
        $visibilityButton.click();

        assert(storyteller.storyPermissionsManager.makePrivate.called);
        assert($visibilityButton.hasClass('btn-busy'), 'Excepted the visibility button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });
  });

  describe('updatePublicButton', function() {
    buildAndCleanTemplate();
    stubStoryPermissionsManager();

    describe('when the story is public', function() {
      var instance;

      beforeEach(function() {
        newStory(true);

        storyteller.dispatcher.dispatch({
          action: Actions.STORY_SET_PUBLISHED_STORY,
          publishedStory: {digest: 'new-digest'},
          storyUid: storyteller.userStoryUid
        });

        instance = new StoryPermissionsRenderer();
      });

      it('attempts to update the published story', function() {
        assert.isFalse($updatePublicButton.prop('disabled'));

        $updatePublicButton.click();

        assert(storyteller.storyPermissionsManager.makePublic.called);
        assert($updatePublicButton.hasClass('btn-busy'), 'Excepted the update button to have a class, .busy');
        assert($errorContainer.hasClass('hidden'), 'Excepted the error container to have a class, .hidden');
      });
    });

    describe('when the story is private', function() {
      var instance;

      beforeEach(function() {
        newStory(false);
        instance = new StoryPermissionsRenderer();
      });

      it('renders the update button in a disabled state', function() {
        assert($updatePublicButton.prop('disabled'), 'updatePublic button should be disabled');

        $updatePublicButton.click();

        assert(storyteller.storyPermissionsManager.makePublic.notCalled, 'makePublic should not be called');
      });
    });
  });
});

