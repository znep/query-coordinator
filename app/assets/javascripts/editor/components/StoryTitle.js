/*
 * A component that renders a story title.
 */

(function($) {
  $.fn.storyTitle = function(storyUid) {
    Util.assertTypeof(storyUid, 'string');

    var titleNodes = this;

    function render() {
      titleNodes.each(function() {
        $(this).text(window.storyStore.getStoryTitle(storyUid));
      });
    };

    window.storyStore.addChangeListener(render);
    render();

    titleNodes.on('click', function() {
      var newTitle = prompt('Please enter a story title', window.storyStore.getStoryTitle(storyUid));
      if (newTitle) {
        window.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: storyUid,
          title: newTitle
        });
      }
    });

    return this;
  };

}(jQuery));
