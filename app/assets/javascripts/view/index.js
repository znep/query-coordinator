import $ from 'jQuery';
import SocrataVisualizations from 'socrata-visualizations';

import '../editor/componentBase';
import '../editor/block-component-renderers/componentGoalTile';
import '../editor/block-component-renderers/componentHero';
import '../editor/block-component-renderers/componentSocrataVisualizationClassic';
import '../editor/block-component-renderers/componentSocrataVisualizationColumnChart';
import '../editor/block-component-renderers/componentSocrataVisualizationFeatureMap';
import '../editor/block-component-renderers/componentSocrataVisualizationHistogram';
import '../editor/block-component-renderers/componentSocrataVisualizationRegionMap';
import '../editor/block-component-renderers/componentSocrataVisualizationTable';
import '../editor/block-component-renderers/componentSocrataVisualizationTimelineChart';
import '../editor/block-component-renderers/componentStoryTile';

import StorytellerUtils from '../StorytellerUtils';
import Environment from '../StorytellerEnvironment';
import PresentationMode from './PresentationMode';

import { windowSizeBreakpointStore } from '../editor/stores/WindowSizeBreakpointStore';

$(document).on('ready', function() {

  var analytics = new StorytellerUtils.Analytics();
  (new PresentationMode());

  SocrataVisualizations.views.RowInspector.setup();

  windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);

  var $window = $(window);

  var $userStoryContainer = $('.user-story-container');
  var $userStory = $('.user-story');
  var $header = $('.user-story-header');
  var $headerMenuButton = $('.user-story-header-menu-button');
  var $headerResponsiveMenuContainer = $('.user-story-responsive-menu-container');

  var headerHeight = parseInt($header.height(), 10);
  var lastScrollY = 0;

  function _applyWindowSizeClass() {
    var windowSizeClass = windowSizeBreakpointStore.getWindowSizeClass();
    var unusedWindowSizeClasses = windowSizeBreakpointStore.getUnusedWindowSizeClasses();

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

        case 'hero':
          $element.
            componentHero(componentData);
          break;

        case 'story.tile':
        case 'story.widget':
          $element.
            componentStoryTile(componentData);
          break;

        case 'goal.tile':
          $element.
            componentGoalTile(componentData);
          break;

        case 'socrata.visualization.classic':
          $element.
            componentSocrataVisualizationClassic(componentData);
          break;

        case 'socrata.visualization.regionMap':
          $element.
            componentSocrataVisualizationRegionMap(componentData);
          break;

        case 'socrata.visualization.choroplethMap': // legacy
          $element.
            componentSocrataVisualizationRegionMap(componentData);
          break;

        case 'socrata.visualization.columnChart':
          $element.
            componentSocrataVisualizationColumnChart(componentData);
          break;

        case 'socrata.visualization.histogram':
          $element.
            componentSocrataVisualizationHistogram(componentData);
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

  if (Environment.IS_STORY_PUBLISHED) {
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-story', 1);
    analytics.sendMetric('domain', 'page-views', 1);

    analytics.flushMetrics();
  }
});
