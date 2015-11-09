(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;

  function StoryActionsRenderer() {
    var _$settingsPanelMakeACopy;

    var _$settingsPanelPublishing = $('.settings-panel-actions');

    _$settingsPanelMakeACopy = _$settingsPanelPublishing.find('.settings-panel-make-a-copy button');

    _attachEvents();

    function _attachEvents() {
      _$settingsPanelMakeACopy.click(function() {
        storyteller.storyActionsManager.makeACopy();
      });
    }
  }

  storyteller.StoryActionsRenderer = StoryActionsRenderer;
})(window);

