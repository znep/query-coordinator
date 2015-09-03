(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;
  var utils = root.socrata.utils;

  var _manager = new storyteller.StoryPermissionsManager();

  function StoryPermissionsRenderer() {
    var _$settingsPanelStoryStatus;
    var _$visibilityLabel;
    var _$visibilityButton;
    var _$updatePublicLabel;
    var _$updatePublicButton;
    var _$errorContainer;

    var _$settingsPanelPublishing = $('.settings-panel-publishing');

    utils.assert(_$settingsPanelPublishing.length === 1);

    _$settingsPanelStoryStatus = _$settingsPanelPublishing.find('.settings-panel-story-status');

    _$visibilityLabel = _$settingsPanelPublishing.find('.settings-panel-story-visibility h3');
    _$visibilityButton = _$settingsPanelPublishing.find('.settings-panel-story-visibility button');

    _$updatePublicLabel = _$settingsPanelPublishing.find('.settings-panel-story-status h3');
    _$updatePublicButton = _$settingsPanelPublishing.find('.settings-panel-story-status button');

    _$errorContainer = _$settingsPanelPublishing.find('.settings-panel-story-publishing-error');

    _attachEvents();
    _render();

    function _attachEvents() {
      storyteller.storyStore.addChangeListener(_render);

      _$visibilityButton.click(function() {
        var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);

        if (permissions.isPublic) {
          _manager.makePrivate(_renderError);
        } else {
          _manager.makePublic(_renderError);
        }

        _$visibilityButton.addClass('busy');
      });
    }

    function _renderError(message) {
      console.error(message);
      _$errorContainer.removeClass('hidden');
      _$visibilityButton.removeClass('busy');
    }

    function _render() {
      var permissions = storyteller.storyStore.getStoryPermissions(storyteller.userStoryUid);

      // TODO: Add these to i18n;
      if (permissions.isPublic) {
        _$visibilityLabel.text('Public');
        _$visibilityButton.text('Make Story Private');
        _$updatePublicButton.prop('disabled', true);
        _$updatePublicLabel.text('Published');
      } else {
        _$visibilityLabel.text('Private');
        _$visibilityButton.text('Make Story Public')
      }

      _$settingsPanelStoryStatus.toggleClass('hidden', !permissions.isPublic);
      _$errorContainer.addClass('hidden');
      _$visibilityButton.removeClass('busy');
    }
  }

  root.storyteller.StoryPermissionsRenderer = StoryPermissionsRenderer;
})(window);
