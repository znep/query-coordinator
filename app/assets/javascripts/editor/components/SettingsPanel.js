/**
 * A component that renders the settingsPanel.
 * You may trigger these events to control the sidebar:
 *
 * 'sidebar:open'
 * 'sidebar:close'
 * 'sidebar:toggle'
 */
;(function($, storyteller) {
  /**
   * Instantiates an SettingsPanel control with the given
   * toggle button. When the user clicks the toggle button,
   * the panel will toggle open or closed.
   *
   * The toggleButton will be given a class of 'active' while
   * the panel is open, as will the panelWrapper, for control of the overlay
   *
   * @param {jQuery} toggleButton - a jQuery reference to the desired toggle button node.
   */
  $.fn.settingsPanel = function(toggleButton) {

    var settingsPanel = $(this).sidebar({
      side: 'left'
    });
    var panelWrapper = settingsPanel.parents('.settings-panel-wrapper');
    var overlay = panelWrapper.find('.settings-panel-overlay');

    // Set up some input events.

    toggleButton.on('click', function() {
      settingsPanel.trigger('sidebar:toggle');
    });

    settingsPanel.find('.close-side-panel-btn').on('click', function() {
      settingsPanel.trigger('sidebar:close');
    });

    $(document).on('keydown', function(e) {
      if (e.ctrlKey && e.keyCode === 188) { // ',' because it's settings
        settingsPanel.trigger('sidebar:toggle');
      }
    });

    settingsPanel.
      on('sidebar:open', function() {
        toggleButton.addClass('active');
        panelWrapper.addClass('active');
        settingsPanel.find('a').eq(0).focus();
      }).
      on('sidebar:close', function() {
        toggleButton.removeClass('active');
        panelWrapper.removeClass('active');
      }).
      on('mousewheel', '.scrollable', storyteller.Util.preventScrolling)

    return this;
  };
}(jQuery, window.socrata.storyteller));
