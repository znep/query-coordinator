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
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * Instantiates a StyleAndPresentationPanel control with the given
   * toggle button. When the user clicks the toggle button,
   * the panel will toggle open or closed.
   *
   * The toggleButton will be given a class of 'active' while
   * the panel is open.
   *
   * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
   */
  $.fn.styleAndPresentationPanel = function(toggleButton) {

    var styleAndPresentationPanel = $(this).sidebar({
      side: 'right'
    });

    // Set up some input events.

    toggleButton.on('click', function() {
      styleAndPresentationPanel.trigger('sidebar:toggle');
      $('#add-content-panel').trigger('sidebar:close');
    });

    styleAndPresentationPanel.find('.content-panel-close-btn').on('click', function() {
      styleAndPresentationPanel.trigger('sidebar:close');
    });

    $(document).on('keydown', function(e) {
      if (e.ctrlKey && e.keyCode === 50) { // '2'
        styleAndPresentationPanel.trigger('sidebar:toggle');
      }
      if (e.keyCode === 27) { // esc
        styleAndPresentationPanel.trigger('sidebar:close');
      }
    });

    styleAndPresentationPanel.
      on('sidebar:open', function() {
        toggleButton.addClass('active');
        styleAndPresentationPanel.find('button[data-panel-toggle="style-and-presentation-panel"]').eq(0).focus();
      }).
      on('sidebar:close', function() {
        toggleButton.
          removeClass('active').
          blur();
      }).
      on('mousewheel', '.scrollable', utils.preventScrolling).
      on('mousedown', '.theme', function(event) {
        var themeId = event.currentTarget.getAttribute('data-theme-id');

        if (themeId) {

          styleAndPresentationPanel.find('.theme').removeClass('active');
          $(event.currentTarget).addClass('active');

          storyteller.dispatcher.dispatch({
            action: Constants.STORY_UPDATE_THEME,
            themeId: themeId
          });
        }
      });

    return this;
  };
}(jQuery, window));
