(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;
  var utils = root.socrata.utils;

  var _manager = new storyteller.StoryPermissionsManager();

  function StoryPermissionsRenderer() {
    var _$settingsPanelStoryStatus;
    var _$visibilityLabel;
    var _$visibilityButton;
    var _$visibilityButtonText;
    var _$updatePublicLabel;
    var _$updatePublicButton;
    var _$updatePublicText;
    var _$publishingHelpText;
    var _$errorContainer;

    var _$settingsPanelPublishing = $('.settings-panel-publishing');

    utils.assert(_$settingsPanelPublishing.length === 1);

    _$settingsPanelStoryStatus = _$settingsPanelPublishing.find('.settings-panel-story-status');

    _$visibilityLabel = _$settingsPanelPublishing.find('.settings-panel-story-visibility h3');
    _$visibilityButton = _$settingsPanelPublishing.find('.settings-panel-story-visibility button');
    _$visibilityButtonText = _$visibilityButton.find('span');

    _$updatePublicLabel = _$settingsPanelPublishing.find('.settings-panel-story-status h3');
    _$updatePublicButton = _$settingsPanelPublishing.find('.settings-panel-story-status button');
    _$updatePublicText = _$updatePublicButton.find('span');

    _$publishingHelpText = _$settingsPanelPublishing.find('.settings-panel-story-publishing-help-text');

    _$errorContainer = $('.settings-panel .settings-panel-errors');

    _attachEvents();
    _render();

    function _attachEvents() {
      storyteller.storyStore.addChangeListener(_render);
      storyteller.storySaveStatusStore.addChangeListener(_render);

      _$visibilityButton.click(function() {
        var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);
        _$errorContainer.addClass('hidden');

        if (permissions.isPublic) {
          _manager.makePrivate(_renderError);
        } else {
          _manager.makePublic(_renderError);
        }

        _$visibilityButton.addClass('busy');
      });

      _$updatePublicButton.click(function() {
        var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);
        _$errorContainer.addClass('hidden');

        if (permissions.isPublic) {
          _manager.makePublic(_renderError);
        } else {
          _renderError(I18n.t('settings_panel.publishing_section.errors.not_published_not_updated'));
        }

        _$updatePublicButton.addClass('busy');
      });
    }

    function _havePublishedAndDraftDiverged() {
      var publishedStory = storyteller.storyStore.getStoryPublishedStory(storyteller.userStoryUid) || root.publishedStory;
      var digest = storyteller.storyStore.getStoryDigest(storyteller.userStoryUid);

      return publishedStory.digest !== digest;
    }

    function _renderError() {
      _$errorContainer.removeClass('hidden');
      _$visibilityButton.removeClass('busy');
      _$updatePublicButton.removeClass('busy');
    }

    function _render() {
      var havePublishedAndDraftDiverged;
      var isStorySaved = storyteller.storySaveStatusStore.isStorySaved(storyteller.userStoryUid);
      var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);

      _$visibilityButton.prop('disabled', !isStorySaved);

      if (permissions.isPublic) {
        havePublishedAndDraftDiverged = _havePublishedAndDraftDiverged();

        _$visibilityLabel.text(I18n.t('settings_panel.publishing_section.visibility.public'));
        _$visibilityButtonText.text(I18n.t('settings_panel.publishing_section.visibility.make_story_private'));
        _$updatePublicButton.prop('disabled', true);
        _$updatePublicLabel.text(I18n.t('settings_panel.publishing_section.status.published'));
        _$publishingHelpText.text(I18n.t('settings_panel.publishing_section.messages.has_been_published'));

        if (havePublishedAndDraftDiverged) {
          _$updatePublicButton.prop('disabled', false);
          _$publishingHelpText.text(I18n.t('settings_panel.publishing_section.messages.previously_published'));
          _$updatePublicLabel.text(I18n.t('settings_panel.publishing_section.status.draft'));
        }
      } else {
        _$visibilityLabel.text(I18n.t('settings_panel.publishing_section.visibility.private'));
        _$visibilityButtonText.text(I18n.t('settings_panel.publishing_section.visibility.make_story_public'));
        _$updatePublicButton.prop('disabled', true);
        _$publishingHelpText.text(I18n.t('settings_panel.publishing_section.messages.can_be_shared_publically'));
      }

      _$settingsPanelStoryStatus.toggleClass('hidden', !permissions.isPublic);
      _$errorContainer.addClass('hidden');
      _$visibilityButton.removeClass('busy');
      _$updatePublicButton.removeClass('busy');
    }
  }

  root.storyteller.StoryPermissionsRenderer = StoryPermissionsRenderer;
})(window);
