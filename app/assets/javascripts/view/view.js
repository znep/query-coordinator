$(document).on('ready', function() {
  'use strict';

  var $userStory = $('.user-story');
  var storyteller = window.socrata.storyteller;
  storyteller.presentationMode = new storyteller.PresentationMode();
  storyteller.flyoutRenderer = new socrata.visualizations.FlyoutRenderer();

  // Init window size classes
  storyteller.windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
  storyteller.windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);
  function _applyWindowSizeClass() {
    var windowSizeClass = storyteller.windowSizeBreakpointStore.getWindowSizeClass();
    var unusedWindowSizeClasses = storyteller.windowSizeBreakpointStore.getUnusedWindowSizeClasses();

    $userStory.
      removeClass(unusedWindowSizeClasses.join(' ')).
      addClass(windowSizeClass);
  }

  // Init visualizations
  $('[data-component-data]').each(function() {
    var $this = $(this);

    $this.componentSocrataVisualizationColumnChart(
      JSON.parse($this.attr('data-component-data'))
    );
  });

  // Init window size
  _applyWindowSizeClass();
});
