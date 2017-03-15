import 'babel-polyfill';
import $ from 'jquery';
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

const renderersRequiringJS = [
  'hero',
  'story.tile',
  'story.widget',
  'goal.embed',
  'goal.tile',
  'socrata.visualization.classic',
  'socrata.visualization.regionMap',
  'socrata.visualization.choroplethMap' ,
  'socrata.visualization.barChart',
  'socrata.visualization.columnChart',
  'socrata.visualization.pieChart',
  'socrata.visualization.histogram',
  'socrata.visualization.table',
  'socrata.visualization.featureMap',
  'socrata.visualization.timelineChart'
];

$(document).on('ready', () => {

  const analytics = new StorytellerUtils.Analytics();
  (new PresentationMode());

  SocrataVisualizations.views.RowInspector.setup();

  windowSizeBreakpointStore.addChangeListener(applyWindowSizeClass);

  const $window = $(window);

  const $userStoryContainer = $('.user-story-container');
  const $userStory = $('.user-story');
  const $adminHeader = $('#site-chrome-admin-header');
  const $header = $('#site-chrome-header');
  const $footer = $('#site-chrome-footer');

  function applyWindowSizeClass() {
    const windowSizeClass = windowSizeBreakpointStore.getWindowSizeClass();
    const unusedWindowSizeClasses = windowSizeBreakpointStore.getUnusedWindowSizeClasses().join(' ');

    $userStoryContainer.
      removeClass(unusedWindowSizeClasses).
      addClass(windowSizeClass);

    $userStory.
      removeClass(unusedWindowSizeClasses).
      addClass(windowSizeClass);
  }

  function moveFooterToBottomOfWindowOrContent() {
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
  $('[data-component-data]').each((index, element) => {
    const $element = $(element);
    const serializedComponentData = element.getAttribute('data-component-data');

    if (serializedComponentData === null) {
      return;
    }

    const componentData = JSON.parse(serializedComponentData);
    const props = {
      componentData,
      blockId: null,
      componentIndex: null,
      theme: null
    };

    if (renderersRequiringJS.includes(componentData.type)) {
      const componentRendererName = StorytellerUtils.typeToComponentRendererName(componentData.type);
      $element[componentRendererName](props);
    } else {
      $element.componentBase(props);
    }
  });

  // Init window size
  applyWindowSizeClass();

  moveFooterToBottomOfWindowOrContent();
  $window.on('resize', moveFooterToBottomOfWindowOrContent);

  if (Environment.IS_STORY_PUBLISHED && !Environment.IS_GOAL) {
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-story', 1);
    analytics.sendMetric('domain', 'page-views', 1);

    analytics.flushMetrics();
  }
});
