(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;

  /**
   * @class StoryActionsManager
   */
  function StoryActionsManager() {

    /**
     * @function makeACopy
     */
    this.makeACopy = function() {
      storyteller.dispatcher.dispatch({
        action: Actions.STORY_MAKE_COPY_MODAL_OPEN
      });
    };

  }

  storyteller.StoryActionsManager = StoryActionsManager;
})(window);

