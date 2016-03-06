import $ from 'jQuery';

import '../componentBase';
import I18n from '../I18n';
import StorytellerUtils from '../../StorytellerUtils';

var WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.componentStoryWidget = componentStoryWidget;

export default function componentStoryWidget(componentData, theme, options) {
  var $this = $(this);
  var rerenderOnResizeTimeout;

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'story.widget',
    StorytellerUtils.format(
      'componentStoryWidget: Unsupported component type {0}',
      componentData.type
    )
  );

  function _handleWindowResize() {
    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      _renderStoryWidget($this, componentData),
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  _updateSrc($this, componentData);

  $this.addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type));
  $this.componentBase(componentData, theme, options);

  $(window).on('resize', _handleWindowResize);

  $this.on('destroy', function() {
    $(window).off('resize', _handleWindowResize);
    $this.empty();
  });

  return $this;
}

function _updateSrc($element, componentData) {
  var storyWidgetSrc;
  var renderedStoryWidgetSrc = $element.attr('data-rendered-story-widget-url');

  StorytellerUtils.assertHasProperties(
    componentData,
    'value.domain',
    'value.storyUid'
  );

  storyWidgetSrc = StorytellerUtils.generateStoryWidgetJsonSrc(
    componentData.value.domain,
    componentData.value.storyUid
  );

  if (renderedStoryWidgetSrc !== storyWidgetSrc) {

    // Although we do some basic validation on the user input,
    // since we must support arbitrary customer domains `storyWidgetSrc`
    // can point to any domain. Accordingly, this is a potential phishing
    // risk.
    $element.attr('data-rendered-story-widget-url', storyWidgetSrc);

    Promise.resolve($.get(storyWidgetSrc)).
      then(
        function(storyWidgetData) {
          _renderStoryWidget($element, componentData, storyWidgetData);
        }
      ).
      catch(
        function() {
          _renderStoryWidgetError($element, componentData);
        }
      );
  }
}

function _ellipsifyText($element, lineCount) {
  var elementHeight = $element.height();
  var lineHeight = Math.ceil(parseFloat($element.css('line-height')));
  var targetElementHeight = lineHeight * lineCount;
  var words;
  var truncatedWords;

  StorytellerUtils.assert(
    (Math.floor(lineCount) === lineCount),
    '`lineCount` must be an integer'
  );

  if (elementHeight > targetElementHeight) {
    words = $element.text().split(' ');

    if (words[words.length - 1] === '…') {
      truncatedWords = words.slice(0, -2);
    } else {
      truncatedWords = words.slice(0, -1);
    }

    $element.text(truncatedWords.join(' ') + '…');

    if (truncatedWords.length > 0) {
      _ellipsifyText($element, lineCount);
    }
  }
}

function _updateTextEllipsification($element) {
  var renderedResponse = $element.attr('data-rendered-story-widget-data');
  var renderedWidth = parseInt($element.attr('data-rendered-story-widget-width'), 10);
  var elementWidth = Math.floor($element.outerWidth(true));
  var storyWidgetData;
  var $widgetTitle;
  var $widgetDescription;

  if (renderedResponse && renderedWidth !== elementWidth) {
    storyWidgetData = JSON.parse(renderedResponse);

    $element.attr('data-rendered-story-widget-width', elementWidth);

    $widgetTitle = $element.find('.story-widget-title');
    $widgetTitle.text(storyWidgetData.title);

    _ellipsifyText($widgetTitle, 2);

    $widgetDescription = $element.find('.story-widget-description');

    if (storyWidgetData.description !== null) {

      $widgetDescription.text(storyWidgetData.description);

      _ellipsifyText($widgetDescription, 3);
    }
  }
}

function _renderStoryWidget($element, componentData, storyWidgetData) {
  var $existingStoryWidgetContainer = $element.find('.story-widget-container');
  var $widgetContainer;
  var $widgetContent;
  var $widgetTitle;
  var $widgetTitleContainer;
  var $widgetImage;
  var $widgetDescription;
  var $widgetViewStory;

  StorytellerUtils.assertHasProperty(componentData, 'type');

  // If there is no story widget data provided we just want to re-ellipsify
  // the text (which we can do by mutating rather than wiping out the entire
  // entire component subtree), but only in the case that the width of
  // the container has changed (doing so more often is not great for
  // performance).
  if (!storyWidgetData) {
    _updateTextEllipsification($element);
    return;
  }

  $element.attr(
    'data-rendered-story-widget-data',
    JSON.stringify(storyWidgetData)
  );

  if ($existingStoryWidgetContainer.length > 0) {
    $existingStoryWidgetContainer.remove();
  }

  $widgetContainer = $(
    '<a>',
    {
      'href': storyWidgetData.url,
      'target': '_blank',
      'class': StorytellerUtils.format(
        'story-widget-container theme-{0}',
        storyWidgetData.theme
      )
    }
  );

  $widgetContent = $('<div>', {'class': 'story-widget typeset'});

  $widgetTitle = $('<h2>', {'class': 'story-widget-title' }).
    text(storyWidgetData.title);

  $widgetTitleContainer = $('<div>', {'class': 'story-widget-title-container'}).
    append($widgetTitle);

  $widgetImage = $(
    '<div>',
    {
      'class': 'story-widget-image'
    }
  );

  if (storyWidgetData.image !== null) {
    $widgetImage.attr('style', StorytellerUtils.format('background-image:url({0})', storyWidgetData.image));
  }

  $widgetDescription = $('<p>', {'class': 'story-widget-description'});

  if (storyWidgetData.description !== null) {
    $widgetDescription.text(storyWidgetData.description);
  }

  $widgetViewStory = $(
    '<div>',
    {'class': 'story-widget-view-story'}
  ).html(
    StorytellerUtils.format(
      '&mdash; {0} &mdash;',
      I18n.t('editor.story_widget.view_story_prompt')
    )
  );

  $widgetContent.append([
    $widgetTitleContainer,
    $widgetImage,
    $widgetDescription,
    $widgetViewStory
  ]);

  $widgetContainer.append($widgetContent);

  $element.append($widgetContainer);

  _ellipsifyText($widgetTitle, 2);

  if ($widgetDescription) {
    _ellipsifyText($widgetDescription, 3);
  }

  $widgetContainer.addClass('rendered');
}

function _renderStoryWidgetError($element, componentData, error) {
  $element.
    empty().
    text(JSON.stringify(error));
}

