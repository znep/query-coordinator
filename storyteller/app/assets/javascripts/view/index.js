import 'babel-polyfill';
import $ from 'jquery';

import SocrataVisualizations from 'common/visualizations';
import MostRecentlyUsed from 'common/most_recently_used';
import { Analytics } from 'common/analytics';
import { defaultHeaders } from 'common/http';
import 'common/notifications/main';
import 'common/site_wide';

import '../editor/componentBase';
import '../editor/block-component-renderers/componentEmbeddedHtml';
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

import Environment from '../StorytellerEnvironment';
import PresentationMode from './PresentationMode';

import { windowSizeBreakpointStore } from '../editor/stores/WindowSizeBreakpointStore';


$(document).on('ready', function() {

  (new PresentationMode());

  SocrataVisualizations.views.RowInspector.setup();

  windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);

  var $window = $(window);

  var $userStoryContainer = $('.user-story-container');
  var $userStory = $('.user-story');
  var $adminHeader = $('#site-chrome-admin-header');
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
    const adminHeaderHeight = $adminHeader.outerHeight() || 0;
    const contentHeight = $userStory.outerHeight();
    const footerHeight = $footer.outerHeight();

    if (viewportHeight > contentHeight + adminHeaderHeight + headerHeight + footerHeight) {
      $footer.css({ position: 'absolute', bottom: 0 });
    } else {
      $footer.css({ position: '', bottom: '' });
    }
  }

  // Init visualizations
  $('[data-component-data]').each(function(index, element) {
    let componentData;
    let props;
    const $element = $(element);
    const serializedComponentData = element.getAttribute('data-component-data');

    if (serializedComponentData !== null) {
      componentData = JSON.parse(serializedComponentData);
      props = {
        componentData,
        blockId: null,
        componentIndex: null,
        theme: null
      };

      switch (componentData.type) {

        case 'hero':
          $element.componentHero(props);
          break;

        case 'story.tile':
        case 'story.widget':
          $element.componentStoryTile(props);
          break;

        case 'goal.embed':
          $element.componentGoalEmbed(props);
          break;

        case 'goal.tile':
          $element.componentGoalTile(props);
          break;

        case 'socrata.visualization.classic':
          $element.componentSocrataVisualizationClassic(props);
          break;

        case 'socrata.visualization.regionMap':
          $element.componentSocrataVisualizationRegionMap(props);
          break;

        case 'socrata.visualization.choroplethMap': // legacy
          $element.componentSocrataVisualizationRegionMap(props);
          break;

        case 'socrata.visualization.barChart':
          $element.componentSocrataVisualizationBarChart(props);
          break;

        case 'socrata.visualization.columnChart':
          $element.componentSocrataVisualizationColumnChart(props);
          break;

        case 'socrata.visualization.pieChart':
          $element.componentSocrataVisualizationPieChart(props);
          break;

        case 'socrata.visualization.histogram':
          $element.componentSocrataVisualizationHistogram(props);
          break;

        case 'socrata.visualization.table':
          $element.componentSocrataVisualizationTable(props);
          break;

        case 'socrata.visualization.featureMap':
          $element.componentSocrataVisualizationFeatureMap(props);
          break;

        case 'socrata.visualization.timelineChart':
          $element.componentSocrataVisualizationTimelineChart(props);
          break;

        case 'embeddedHtml':
          $element.componentEmbeddedHtml(props);
          break;

        default:
          $element.componentBase(props);
          break;
      }
    }

  });

  // Init window size
  _applyWindowSizeClass();

  _moveFooterToBottomOfWindowOrContent();
  $window.on('resize', _moveFooterToBottomOfWindowOrContent);

  if (Environment.IS_STORY_PUBLISHED && !Environment.IS_GOAL) {
    var analytics = new Analytics();
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-story', 1);
    analytics.sendMetric('domain', 'page-views', 1);

    analytics.flushMetrics();

    // Using the old accessor for the CSRF token, since Storyteller doesn't use
    // the newer serverConfig object like the common Analytics module expects.
    var pageViewHeaders = {
      ...defaultHeaders,
      'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
    };
    analytics.registerPageView(Environment.STORY_UID, pageViewHeaders);
  }

  if (Environment.CURRENT_USER && Environment.STORY_UID) {
    new MostRecentlyUsed({namespace: `socrata:assets:mru:${Environment.CURRENT_USER.id}`}).add(Environment.STORY_UID);
  }
});
