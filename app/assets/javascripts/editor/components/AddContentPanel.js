import $ from 'jQuery';
import 'jQuery-sidebar';

import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { storyStore } from '../stores/StoryStore';

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
$.fn.addContentPanel = AddContentPanel;

export default function AddContentPanel(toggleButton) {

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
    if (e.ctrlKey && e.keyCode === 49) { // '1'
      toggleButton.click();
    }
    if (e.keyCode === 27) { // esc
      addContentPanel.trigger('sidebar:close');
    }
  });

  $userStory.on('click rich-text-editor::content-click', handleClickOutsideAddContentPanel);

  function handleClickOutsideAddContentPanel(event) {
    if (!$addContentPanelBtn.is(event.target) && addContentPanel.hasClass('active')) {
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
    on('mousewheel', '.scrollable', StorytellerUtils.preventScrolling).
    on('dblclick', '.inspiration-block', function(e) {
      var blockContent = JSON.parse(e.currentTarget.getAttribute('data-block-content'));

      if (blockContent) {
        dispatcher.dispatch({
          action: Actions.STORY_INSERT_BLOCK,
          storyUid: Environment.STORY_UID,
          blockContent: blockContent,
          insertAt: storyStore.getStoryBlockIds(Environment.STORY_UID).length
        });

        setTimeout(function() {
          var $lastBlock = $('.block-edit:last-child');
          var lastBlockOffset = $lastBlock.offset().top + $lastBlock.height();

          $('html, body').animate({
            scrollTop: lastBlockOffset
          });
        }, 200);
      }
    });

  return this;
}
