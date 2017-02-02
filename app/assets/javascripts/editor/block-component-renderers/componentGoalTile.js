import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import I18n from '../I18n';
import StorytellerUtils from '../../StorytellerUtils';

const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.componentGoalTile = componentGoalTile;

// Given a domain, returns a promise for an I18n.t style function that respects
// the domain's string overrides.
// The response is cached for the lifetime of the page.
const fetchOpenPerformanceDomainI18n = _.memoize((domain) => {
  return StorytellerUtils.fetchDomainStrings('en', domain).then((domainStrings) => {
    // Storyteller javascript expects all localization strings to live under `editor`,
    // for historical reasons. See EN-5158.
    domainStrings = {
      editor: domainStrings
    };

    return (key) => {
      // Fetch from domain strings first, then fall back to storyteller strings
      return _.get(domainStrings, key, I18n.t(key));
    };
  });
});

export default function componentGoalTile(props) {
  let rerenderOnResizeTimeout;
  const $this = $(this);
  const { componentData } = props;

  function handleWindowResize() {
    clearTimeout(rerenderOnResizeTimeout);

    fetchOpenPerformanceDomainI18n(componentData.value.domain).then((domainI18n) => {
      rerenderOnResizeTimeout = setTimeout(
        renderGoalTile($this, domainI18n, componentData),
        // Add some jitter in order to make sure multiple visualizations are
        // unlikely to all attempt to rerender themselves at the exact same
        // moment.
        WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
      );
    });
  }

  // Execution starts here

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'goal.tile',
    `componentGoalTile: Unsupported component type ${componentData.type}`
  );

  $(window).on('resize', handleWindowResize);

  $this.on('destroy', () => {
    $(window).off('resize', handleWindowResize);
    $this.empty();
  });

  $this.componentBase(props);
  $this.addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type));

  updateSrc($this, componentData);

  return $this;
}

function updateSrc($element, componentData) {
  StorytellerUtils.assertHasProperties(
    componentData,
    'value.domain',
    'value.goalUid',
    'value.goalFullUrl'
  );

  const renderedGoalTileSrc = $element.attr('data-rendered-goal-tile-url');
  const goalTileSrc = StorytellerUtils.generateGoalTileJsonSrc(
    componentData.value.domain,
    componentData.value.goalUid
  );

  if (renderedGoalTileSrc !== goalTileSrc) {

    // Although we do some basic validation on the user input,
    // since we must support arbitrary customer domains `goalTileSrc`
    // can point to any domain. Accordingly, this is a potential phishing
    // risk.
    $element.attr('data-rendered-goal-tile-url', goalTileSrc);

    Promise.all([
      Promise.resolve($.get(goalTileSrc)),
      fetchOpenPerformanceDomainI18n(componentData.value.domain)
    ]).
    then((resolutions) => {
      const [ goalTileData, domainI18n ] = resolutions;
      renderGoalTile($element, domainI18n, componentData, goalTileData);
    }).
    catch(() => {
      renderGoalTileError($element);
    });
  }
}

function updateTextEllipsification($element) {
  const renderedResponse = $element.attr('data-rendered-goal-tile-data');
  const renderedWidth = parseInt($element.attr('data-rendered-goal-tile-width'), 10);
  const elementWidth = Math.floor($element.outerWidth(true));

  if (renderedResponse && renderedWidth !== elementWidth) {

    const goalTileData = JSON.parse(renderedResponse);
    $element.attr('data-rendered-goal-tile-width', elementWidth);

    const $tileTitle = $element.find('.goal-tile-title');
    const $tileMetricUnit = $element.find('.goal-tile-metric-unit');
    const $tileMetricSubtitle = $element.find('.goal-tile-metric-subtitle');

    $tileTitle.text(_.get(goalTileData, 'name'));
    $tileMetricUnit.text(formatMetricUnit(goalTileData));
    $tileMetricSubtitle.text(expandSubtitle(goalTileData));

    StorytellerUtils.ellipsifyText($tileTitle, 2);
    StorytellerUtils.ellipsifyText($tileMetricUnit, 3);
    StorytellerUtils.ellipsifyText($tileMetricSubtitle, 2);
  }
}

function formatMetricValue(goalTileData) {
  const value = _.get(
    goalTileData,
    'prevailing_measure.computed_values.metric.current_value'
  );

  return (_.isNumber(value)) ? StorytellerUtils.formatValueWithoutRounding(value) : '-';
}

function formatMetricUnit(goalTileData) {
  return (_.get(goalTileData, 'prevailing_measure.unit') === 'percent') ?
    I18n.t('editor.open_performance.measure.unit_percent') :
    _.get(goalTileData, 'prevailing_measure.unit');
}

function expandSubtitle(goalTileData) {
  var customSubtitle = _.get(goalTileData, 'prevailing_measure.summary');
  var defaultSubtitle = StorytellerUtils.format(
    I18n.t('editor.open_performance.measure.subheadline') || '',
    _.get(goalTileData, 'prevailing_measure.name'),
    _.get(goalTileData, 'prevailing_measure.unit')
  );

  return customSubtitle || defaultSubtitle;
}

function formatEndDate(endDate) {

  return StorytellerUtils.format(
    '{0} {1}, {2}',
    I18n.t('editor.time.full_month_' + (endDate.getMonth() + 1)),
    endDate.getDate(),
    endDate.getFullYear()
  );
}

function renderGoalTile($element, domainI18n, componentData, goalTileData) {
  function expandProgress(progress, isEnded) {
    let expandedProgress = null;

    if (progress != null) {

      expandedProgress = domainI18n(
        StorytellerUtils.format(
          'editor.open_performance.measure.{0}progress.{1}',
          ((isEnded) ? 'end_' : ''),
          progress
        )
      );
    }

    return _.isUndefined(expandedProgress) ? progress : expandedProgress;
  }

  let goalProgress;
  let goalEndDate;
  let goalIsEnded;
  let colorPalette;
  let $tileContainer;
  let $tileContent;
  let $tileTitle;
  let $tileTitleContainer;
  let $tileMetricValue;
  let $tileMetricUnit;
  let $tileMetricSubtitle;
  let $tileMetricContainer;
  let $tileProgress;
  let $tileProgressEndDate;
  let $tilePublicPrivate;
  let $tileMetadataContainer;
  let $tileViewGoal;

  StorytellerUtils.assertHasProperty(componentData, 'type');

  // If there is no story tile data provided we just want to re-ellipsify
  // the text (which we can do by mutating rather than wiping out the entire
  // entire component subtree), but only in the case that the width of
  // the container has changed (doing so more often is not great for
  // performance).
  if (!goalTileData) {

    updateTextEllipsification($element);
    return;
  }

  // Pre-compute some values

  goalProgress = _.get(
    goalTileData,
    'prevailing_measure.computed_values.progress.progress'
  );
  goalEndDate = new Date(_.get(goalTileData, 'prevailing_measure.end'));
  goalIsEnded = (
    // Calling the Date constructor with an invalid argument will yield an
    // Invalid Date, and calling `.getTime()` on an Invalid Date will yield
    // NaN, so this comparison should be what we want even if the goal end
    // date is not present or garbage.
    goalEndDate.getTime() < Date.now()
  );

  // Start rendering

  removeGoalTile($element);

  $element.attr(
    'data-rendered-goal-tile-data',
    JSON.stringify(goalTileData)
  );

  $element.attr(
    'data-rendered-goal-tile-width',
    Math.floor($element.outerWidth(true))
  );

  $tileContainer = $(
    '<a>',
    {
      'href': _.get(componentData, 'value.goalFullUrl', '#'),
      'target': '_blank',
      'class': 'goal-tile-container'
    }
  );

  switch (goalProgress) {
    case 'good':
      colorPalette = 'green';
      break;
    case 'needs_more_data':
    case 'no_status':
    case 'within_tolerance':
      colorPalette = 'yellow';
      break;
    case 'poor':
    case 'bad':
      colorPalette = 'red';
      break;
    case 'no_judgement':
    case 'none':
    case 'progressing':
    default:
      colorPalette = 'blue';
      break;
  }

  $tileContent = $('<div>', {'class': 'goal-tile typeset palette-' + colorPalette});

  $tileTitle = $('<h2>', {'class': 'goal-tile-title' }).
    text(_.get(goalTileData, 'name'));

  $tileTitleContainer = $('<div>', {'class': 'goal-tile-title-container'}).
    append($tileTitle);

  $tileMetricValue = $('<h2>', {'class': 'goal-tile-metric-value'}).
    text(formatMetricValue(goalTileData));

  $tileMetricUnit = $('<h3>', {'class': 'goal-tile-metric-unit'}).
    text(formatMetricUnit(goalTileData));

  $tileMetricSubtitle = $('<h4>', {'class': 'goal-tile-metric-subtitle'}).
    text(expandSubtitle(goalTileData));

  $tileMetricContainer = $('<div>', {'class': 'goal-tile-metric-container'}).
    append([
      $tileMetricValue,
      $tileMetricUnit,
      $tileMetricSubtitle
    ]);

  $tileProgress = $('<span>', {'class': 'goal-tile-metric-progress'}).
    text(
      expandProgress(
        goalProgress,
        goalIsEnded
      )
    );

  if (goalIsEnded) {

    $tileProgressEndDate = $('<span>', {'class': 'goal-tile-metric-progress-end-date'}).
      text(formatEndDate(goalEndDate));
  }

  $tilePublicPrivate = $('<span>', {'class': 'goal-tile-public-private'});

  if (_.get(goalTileData, 'is_public')) {

    $tilePublicPrivate.
      addClass('public').
      text(I18n.t('editor.goal_tile.public_label'));
  } else {

    $tilePublicPrivate.
      addClass('private').
      text(I18n.t('editor.goal_tile.private_label'));
  }

  $tileMetadataContainer = $('<div>', {'class': 'goal-tile-metadata-container'}).
    append([
      $tileProgress,
      $tileProgressEndDate
    ]);

  $tileViewGoal = $('<div>', {'class': 'goal-tile-view-goal'}).
    text(I18n.t('editor.goal_tile.view_goal_prompt'));

  $tileContent.append([
    $tileTitleContainer,
    $tileMetricContainer,
    $tileMetadataContainer,
    $tileViewGoal
  ]);

  $tileContainer.append($tileContent);
  $element.append($tileContainer);

  $tileContainer.addClass('rendered');

  StorytellerUtils.ellipsifyText($tileTitle, 2);
  StorytellerUtils.ellipsifyText($tileMetricUnit, 3);
  StorytellerUtils.ellipsifyText($tileMetricSubtitle, 2);

  // EN-4869 - Let's revisit ellipsification...
  //
  // So, sometimes `.ellipsifyText()` runs before the browser has applied a
  // custom font (Open Sans in this case) to the element, in which case the
  // difference in em-width between the default font (Helvetica on OSX) and
  // Open Sans causes the ellipsification to be incorrect. By doing the
  // ellipsification once immediately, and again 500 milliseconds later, and by
  // setting `overflow: hidden` on the container element, we can mitigate the
  // effects of the ellipsification sometimes being incorrect by hiding the
  // overflow and then rerunning it again, hopefully once the browser has
  // applied the custom font.
  //
  // There appear to be no reliable methods by which we can wait for the
  // browser to finish applying custom fonts before attempting to do
  // the ellipsification.
  //
  // A real solution would be to either:
  //
  // 1) Not use ellipsification on elements to which a custom font has been
  //    applied; or
  // 2) Use some CSS method to do 'fake' ellipsification.
  //
  // We have had this discussion with UX folks several times in the past, but
  // maybe this time we will be more resolute or just find our peace with this
  // frustratingly non-optimal approach.
  setTimeout(
    () => {
      StorytellerUtils.ellipsifyText($tileTitle, 2);
      StorytellerUtils.ellipsifyText($tileMetricUnit, 3);
      StorytellerUtils.ellipsifyText($tileMetricSubtitle, 2);
    },
    500
  );
}

function removeGoalTile($element) {

  $element.
    removeClass('component-error').
    children().
    // Don't accidentally remove the edit control when trying to clear the
    // component's DOM tree in order to re-render it.
    not('.component-edit-controls-container').
    remove();
}

function renderGoalTileError($element) {

  removeGoalTile($element);

  $element.
    addClass('component-error').
    append([
      $('<p>').text(I18n.t('editor.goal_tile.render_error'))
    ]);
}
