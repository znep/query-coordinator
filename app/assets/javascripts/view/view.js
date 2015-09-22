$(document).on('ready', function() {
  'use strict';

  var $userStory = $('.user-story');
  var storyteller = window.socrata.storyteller;
  storyteller.presentationMode = new storyteller.PresentationMode();
  storyteller.flyoutRenderer = new socrata.visualizations.FlyoutRenderer();
  socrata.visualizations.RowInspector.setup();

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
  $('[data-component-data]').each(function(index, element) {
    var $element = $(element);
    var serializedComponentData = element.getAttribute('data-component-data');
    var componentData;

    if (componentData !== null) {

      componentData = JSON.parse(serializedComponentData);

      switch (componentData.type) {

        case 'socrata.visualization.columnChart':
          $element.
            height(componentData.value.layout.height).
            on('SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT', function(event) {
              var payload = event.originalEvent.detail;

              if (payload !== null) {
                storyteller.flyoutRenderer.render(payload);
              } else {
                storyteller.flyoutRenderer.clear();
              }
            }).
            socrataColumnChart(componentData.value.vif);
          break;

        case 'socrata.visualization.featureMap':
          $element.
            height(componentData.value.layout.height).
            on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', function(event) {
              var payload = event.originalEvent.detail;

              if (payload !== null) {
                storyteller.flyoutRenderer.render(payload);
              } else {
                storyteller.flyoutRenderer.clear();
              }
            }).
            socrataFeatureMap(componentData.value.vif);
          break;

        default:
          break;
      }
    }
  });

  // Init window size
  _applyWindowSizeClass();
});
