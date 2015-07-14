/**
 * A component that renders the AddContentPanel.
 * It allows the user to add content via the inspiration story.
 *
 * You may trigger these events to control the sidebar:
 *
 * 'sidebar:open'
 * 'sidebar:close'
 * 'sidebar:toggle'
 *
 */
;(function($) {
  /**
   * Instantiates an AddContentPanel control with the given
   * toggle button. When the user clicks the toggle button,
   * the panel will toggle open or closed.
   *
   * The toggleButton will be given a class of 'active' while
   * the panel is open.
   *
   * @param {string} inspirationStoryUid - The story to render as inspiration
   *                                       (available content blocks).
   * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
   */
  $.fn.addContentPanel = function(inspirationStoryUid, toggleButton) {
    var addContentPanel = $(this).sidebar({
      side: 'right'
    });

    // Set up the inspiration story renderer
    var inspirationStoryOptions = {
      storyUid: inspirationStoryUid,
      storyContainerElement: addContentPanel.find('.inspiration-story'),
      editable: false,
      onRenderError: function() { addContentPanel.find('.inspiration-story-error').removeClass('hidden'); }
    };
    var inspirationStoryRenderer = new StoryRenderer(inspirationStoryOptions);

    // Set up some input events.

    toggleButton.on('click', function() {
      addContentPanel.trigger('sidebar:toggle');
    });

    addContentPanel.find('.close-content-panel-btn a').on('click', function() {
      addContentPanel.trigger('sidebar:close');
    });

    $(document).on('keydown', function(e) {
      if (e.ctrlKey && e.keyCode === 49) { // '1'
        addContentPanel.trigger('sidebar:toggle');
      }
    });

    addContentPanel.
      on('sidebar:open', function() {
        toggleButton.addClass('active');
        addContentPanel.find('a').eq(0).focus();
      }).
      on('sidebar:close', function() {
        toggleButton.removeClass('active');
      }).
      on('mousewheel', '.scrollable', function(e) {
        // Prevent mouse scrolls from bubbling
        // up to document.
        var target = $(this);
        var scrollTop = target.scrollTop();

        var delta = e.originalEvent.deltaY;
        if (delta < 0) {
          // Scrolling up.
          if (scrollTop === 0) {
            // Past top.
            e.preventDefault();
          }
        } else if (delta > 0) {
          // Scrolling down.
          var innerHeight = target.innerHeight();
          var scrollHeight = target[0].scrollHeight;

          if (scrollTop >= scrollHeight - innerHeight) {
            // Past bottom.
            e.preventDefault();
          }
        }
      });
  };
}(jQuery));
