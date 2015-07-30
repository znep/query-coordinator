/*
 * A component that renders a story title.
 */

(function($, socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storyTitle = function(storyUid) {

    utils.assertIsOneOfTypes(storyUid, 'string');

    var titleNodes = this;

    function render() {
      titleNodes.each(function() {
        $(this).text(storyteller.storyStore.getStoryTitle(storyUid));
      });
    };

    storyteller.storyStore.addChangeListener(render);
    render();

    titleNodes.on('click', function() {
      var newTitle = prompt('Please enter a story title', storyteller.storyStore.getStoryTitle(storyUid));
      if (newTitle) {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: storyUid,
          title: newTitle
        });
      }
    });

    return this;
  };

}(jQuery, window.socrata));
