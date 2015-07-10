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
  };

}(jQuery));
