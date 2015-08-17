/*
 * A component that renders a story title.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  $.fn.storyTitle = function(storyUid) {

    utils.assertIsOneOfTypes(storyUid, 'string');

    var titleNodes = this;

    function render() {
      titleNodes.each(function() {
        $(this).text(storyteller.storyStore.getStoryTitle(storyUid));
      });
    }

    storyteller.storyStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window));
