/*
 * A component that renders a story title.
 */

(function($, namespace) {
  $.fn.storyTitle = function(storyUid) {
    var Util = namespace.Util;

    Util.assertIsOneOfTypes(storyUid, 'string');

    var titleNodes = this;

    function render() {
      titleNodes.each(function() {
        $(this).text(namespace.storyStore.getStoryTitle(storyUid));
      });
    };

    namespace.storyStore.addChangeListener(render);
    render();

    titleNodes.on('click', function() {
      var newTitle = prompt('Please enter a story title', namespace.storyStore.getStoryTitle(storyUid));
      if (newTitle) {
        namespace.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: storyUid,
          title: newTitle
        });
      }
    });

    return this;
  };

}(jQuery, window.socrata.storyteller));
