$(document).on('ready', function() {
  'use strict';

  var $userStory = $('.user-story');
  var storyteller = window.socrata.storyteller;
  storyteller.presentationMode = new storyteller.PresentationMode();
  storyteller.flyoutRenderer = new socrata.visualizations.views.FlyoutRenderer();
  socrata.visualizations.views.RowInspector.setup();

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

    if (serializedComponentData !== null) {

      componentData = JSON.parse(serializedComponentData);

      switch (componentData.type) {

        case 'socrata.visualization.classic':
          $element.
            componentSocrataVisualizationClassic(componentData);
          break;

        case 'socrata.visualization.choroplethMap':
          $element.
            componentSocrataVisualizationChoroplethMap(componentData);
          break;

        case 'socrata.visualization.columnChart':
          $element.
            componentSocrataVisualizationColumnChart(componentData);
          break;

        case 'socrata.visualization.featureMap':
          $element.
            componentSocrataVisualizationFeatureMap(componentData);
          break;

        case 'socrata.visualization.timelineChart':
          $element.
            componentSocrataVisualizationTimelineChart(componentData);
          break;

        default:
          $element.
            componentBase(componentData);
          break;
      }
    }
  });

  // Init window size
  _applyWindowSizeClass();
});
