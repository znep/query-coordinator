import $ from 'jQuery';

import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { storyStore } from '../stores/StoryStore';

/**
 * A component that renders the StyleAndPresentationPanel.
 * It allows the user to change the style of their story.
 *
 * You may trigger these events to control the sidebar:
 *
 * 'sidebar:open'
 * 'sidebar:close'
 * 'sidebar:toggle'
 *
 * Instantiates a StyleAndPresentationPanel control with the given
 * toggle button. When the user clicks the toggle button,
 * the panel will toggle open or closed.
 *
 * The toggleButton will be given a class of 'active' while
 * the panel is open.
 *
 * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
 */
$.fn.styleAndPresentationPanel = StyleAndPresentationPanel;

export default function StyleAndPresentationPanel(toggleButton) {

  const styleAndPresentationPanel = $(this).sidebar({
    side: 'right'
  });
  const $userStoryContainer = $('.user-story-container');
  const $stylePanelBtn = $('.style-panel-btn');
  const $addContentPanel = $('#add-content-panel');
  const $themeList = styleAndPresentationPanel.find('.theme-list');

  // React to store changes.

  storyStore.addChangeListener(updateSelectedTheme);
  updateSelectedTheme();

  // Set up some input events.

  toggleButton.on('click', () => {
    styleAndPresentationPanel.trigger('sidebar:toggle');
    $addContentPanel.trigger('sidebar:close');
  });

  styleAndPresentationPanel.find('.content-panel-close-btn').on('click', () => {
    styleAndPresentationPanel.trigger('sidebar:close');
  });

  $(document).on('keydown', (event) => {
    if (event.ctrlKey && event.keyCode === 50) { // '2'
      toggleButton.click();
    }
    if (event.keyCode === 27) { // esc
      styleAndPresentationPanel.trigger('sidebar:close');
    }
  });

  $userStoryContainer.on('click rich-text-editor::content-click', handleClickOutsideStylePanel);

  styleAndPresentationPanel.
    on('sidebar:open', () => {
      toggleButton.addClass('active');
      styleAndPresentationPanel.addClass('active');
      styleAndPresentationPanel.find('button[data-panel-toggle="style-and-presentation-panel"]').eq(0).focus();
    }).

    on('sidebar:close', () => {
      toggleButton.
        removeClass('active').
        blur();
      styleAndPresentationPanel.removeClass('active');
    }).

    on('mousewheel', '.scrollable', StorytellerUtils.preventScrolling).

    on('mousedown', '.theme', (event) => {
      const theme = event.currentTarget.getAttribute('data-theme');

      if (theme) {
        dispatcher.dispatch({
          action: Actions.STORY_UPDATE_THEME,
          storyUid: Environment.STORY_UID,
          theme: theme
        });
      }
    });

  return this;

  function handleClickOutsideStylePanel(event) {
    if (!$stylePanelBtn.is(event.target) && styleAndPresentationPanel.hasClass('active')) {
      styleAndPresentationPanel.trigger('sidebar:close');
    }
  }

  function updateSelectedTheme() {
    const currentTheme = storyStore.getStoryTheme(Environment.STORY_UID);
    const currentThemeItem = $themeList.find(`.theme[data-theme="${currentTheme}"]`);
    if (!currentThemeItem.hasClass('active')) {
      $themeList.find('.theme.active').removeClass('active');
      currentThemeItem.addClass('active');
    }
  }
}
