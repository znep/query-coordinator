/*
 * A component that renders a story title.
 */

(function($, storyteller) {
  $.fn.storyTitle = function(storyUid) {
    var Util = storyteller.Util;

    Util.assertIsOneOfTypes(storyUid, 'string');

    var titleNodes = this;

    function render() {
      titleNodes.each(function() {
        $(this).text(storyteller.storyStore.getStoryTitle(storyUid));
      });
    };

    storyteller.storyStore.addChangeListener(render);
    render();

    return this;
  };

}(jQuery, window.socrata.storyteller));
