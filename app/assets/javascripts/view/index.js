import $ from 'jQuery';
import SocrataVisualizations from 'socrata-visualizations';

import '../editor/componentBase';
import '../editor/block-component-renderers/componentGoalEmbed';
import '../editor/block-component-renderers/componentGoalTile';
import '../editor/block-component-renderers/componentHero';
import '../editor/block-component-renderers/componentSocrataVisualizationClassic';
import '../editor/block-component-renderers/componentSocrataVisualizationBarChart';
import '../editor/block-component-renderers/componentSocrataVisualizationColumnChart';
import '../editor/block-component-renderers/componentSocrataVisualizationFeatureMap';
import '../editor/block-component-renderers/componentSocrataVisualizationHistogram';
import '../editor/block-component-renderers/componentSocrataVisualizationPieChart';
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
  var $header = $('#site-chrome-header');
  var $footer = $('#site-chrome-footer');

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

  function _moveFooterToBottomOfWindowOrContent() {
    const viewportHeight = $window.height();
    const headerHeight = $header.outerHeight();
    const contentHeight = $userStory.outerHeight();
    const footerHeight = $footer.outerHeight();

    if (viewportHeight > contentHeight + headerHeight + footerHeight) {
      $footer.css({ position: 'absolute', bottom: 0 });
    } else {
      $footer.css({ position: '', bottom: '' });
    }
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

        case 'goal.embed':
          $element.
            componentGoalEmbed(componentData);
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

        case 'socrata.visualization.barChart':
          $element.
            componentSocrataVisualizationBarChart(componentData);
          break;

        case 'socrata.visualization.columnChart':
          $element.
            componentSocrataVisualizationColumnChart(componentData);
          break;

        case 'socrata.visualization.pieChart':
          $element.
            componentSocrataVisualizationPieChart(componentData);
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

  // Init window size
  _applyWindowSizeClass();

  _moveFooterToBottomOfWindowOrContent();
  $window.on('resize', _moveFooterToBottomOfWindowOrContent);

  if (Environment.IS_STORY_PUBLISHED) {
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-story', 1);
    analytics.sendMetric('domain', 'page-views', 1);

    analytics.flushMetrics();
  }
});
