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
          _renderError('Your story has not been published and cannot be updated.');
        }

        _$updatePublicButton.addClass('busy');
      });
    }

    function _renderError() {
      _$errorContainer.removeClass('hidden');
      _$visibilityButton.removeClass('busy');
      _$updatePublicButton.removeClass('busy');
    }

    function _render() {
      var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);
      var isStorySaved = storyteller.storySaveStatusStore.isStorySaved();

      _$visibilityButton.prop('disabled', !isStorySaved);

      debugger;
      // TODO: Add these to i18n;
      if (permissions.isPublic) {
        _$visibilityLabel.text('Public');
        _$visibilityButtonText.text('Make Story Private');
        _$updatePublicButton.prop('disabled', true);
        _$updatePublicLabel.text('Published');
      } else {
        _$visibilityLabel.text('Private');
        _$visibilityButtonText.text('Make Story Public');
        _$updatePublicButton.prop('disabled', true);
      }

      _$settingsPanelStoryStatus.toggleClass('hidden', !permissions.isPublic);
      _$errorContainer.addClass('hidden');
      _$visibilityButton.removeClass('busy');
      _$updatePublicButton.removeClass('busy');
    }
  }

  root.storyteller.StoryPermissionsRenderer = StoryPermissionsRenderer;
})(window);
