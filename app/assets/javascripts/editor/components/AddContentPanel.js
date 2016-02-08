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
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * Instantiates an AddContentPanel control with the given
   * toggle button. When the user clicks the toggle button,
   * the panel will toggle open or closed.
   *
   * The toggleButton will be given a class of 'active' while
   * the panel is open.
   *
   * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
   */
  $.fn.addContentPanel = function(toggleButton) {

    var addContentPanel = $(this).sidebar({
      side: 'right'
    });
    var $userStory = $('.user-story');
    var $addContentPanelBtn = $('.content-panel-btn');

    // Set up some input events.

    toggleButton.on('click', function() {
      addContentPanel.trigger('sidebar:toggle');
      $('#style-and-presentation-panel').trigger('sidebar:close');
    });

    addContentPanel.find('.content-panel-close-btn').on('click', function() {
      addContentPanel.trigger('sidebar:close');
    });

    $(document).on('keydown', function(e) {
      if (e.ctrlKey && e.keyCode === 49 || e.metaKey && e.keyCode === 49) { // '1'
        e.preventDefault();
        addContentPanel.trigger('sidebar:toggle');
      }
      if (e.keyCode === 27) { // esc
        addContentPanel.trigger('sidebar:close');
      }
    });

    $userStory.on('click', function(event) {
      handleClickOutsideAddContentPanel(event);
    });

    $(document).on('rich-text-editor::focus-change', function(event) {
      handleClickOutsideAddContentPanel(event);
    });

    function handleClickOutsideAddContentPanel(event) {
      if (($userStory.is(event.target) || !$addContentPanelBtn.is(event.target)) && addContentPanel.hasClass('active')) {
        addContentPanel.trigger('sidebar:close');
      }
    }

    addContentPanel.
      on('sidebar:open', function() {
        toggleButton.addClass('active');
        addContentPanel.addClass('active');
        addContentPanel.find('button[data-panel-toggle="add-content-panel"]').eq(0).focus();
      }).
      on('sidebar:close', function() {
        toggleButton.
          removeClass('active').
          blur();
        addContentPanel.removeClass('active');
      }).
      on('mousewheel', '.scrollable', utils.preventScrolling).
      on('dblclick', '.inspiration-block', function(e) {
        var blockContent = JSON.parse(e.currentTarget.getAttribute('data-block-content'));

        if (blockContent) {
          storyteller.dispatcher.dispatch({
            action: Actions.STORY_INSERT_BLOCK,
            storyUid: storyteller.userStoryUid,
            blockContent: blockContent,
            insertAt: storyteller.storyStore.getStoryBlockIds(storyteller.userStoryUid).length
          });
        }
      });

    return this;
  };
}(jQuery, window));
