$(document).on('ready', function() {
  'use strict';

  var $userStory = $('.user-story');
  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  storyteller.analytics = new socrata.utils.Analytics();
  storyteller.presentationMode = new storyteller.PresentationMode();
  storyteller.flyoutRenderer = new socrata.visualizations.views.FlyoutRenderer();
  socrata.visualizations.views.RowInspector.setup();
  // Init window size classes
  storyteller.windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
  storyteller.windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);

  var $window = $(window);
  var $userStoryContainer = $('.user-story-container');
  var $userStory = $('.user-story');
  var $header = $('.user-story-header');
  var $headerMenuButton = $('.user-story-header-menu-button');
  var $headerResponsiveMenuContainer = $('.user-story-responsive-menu-container');

  var headerHeight = parseInt($header.height(), 10);
  var lastScrollY = 0;

  function _applyWindowSizeClass() {
    var windowSizeClass = storyteller.windowSizeBreakpointStore.getWindowSizeClass();
    var unusedWindowSizeClasses = storyteller.windowSizeBreakpointStore.getUnusedWindowSizeClasses();

    $userStoryContainer.
      removeClass(unusedWindowSizeClasses.join(' ')).
      addClass(windowSizeClass);

    $userStory.
      removeClass(unusedWindowSizeClasses.join(' ')).
      addClass(windowSizeClass);
  }

  function _showOrHideHeaderAndResponsiveMenu() {
    var scrollingDown = window.scrollY > lastScrollY;
    var scrolledPastHeader = window.scrollY > headerHeight;

    if (scrollingDown && scrolledPastHeader) {
      $header.addClass('withdrawn');
      $headerResponsiveMenuContainer.addClass('withdrawn');
    } else {
      $header.removeClass('withdrawn');

      if ($headerMenuButton.hasClass('active')) {
        $headerResponsiveMenuContainer.removeClass('withdrawn');
      }
    }

    lastScrollY = window.scrollY;
  }

  function _showOrHideResponsiveMenu() {
    $headerMenuButton.toggleClass('active');
    $headerResponsiveMenuContainer.toggleClass('withdrawn');
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

        case 'socrata.visualization.table':
          $element.
            componentSocrataVisualizationTable(componentData);
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

  // Handle showing/hiding the header on page scroll
  $window.on('scroll', _showOrHideHeaderAndResponsiveMenu);
  // Handle menu toggle when at small size
  $headerMenuButton.on('click', _showOrHideResponsiveMenu);
  // Init window size
  _applyWindowSizeClass();

  if (isStoryPublished) {
    storyteller.analytics.sendMetric('domain', 'js-page-view', 1);
    storyteller.analytics.flushMetrics();
  }
});
