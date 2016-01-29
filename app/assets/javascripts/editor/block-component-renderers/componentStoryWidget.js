(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  var WINDOW_RESIZE_RERENDER_DELAY = 200;

  function _updateSrc($element, componentData) {
    var storyWidgetSrc;
    var renderedStoryWidgetSrc = $element.attr('data-rendered-story-widget-url');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'domain');
    utils.assertHasProperty(componentData.value, 'storyUid');

    storyWidgetSrc = utils.generateStoryWidgetJsonSrc(
      componentData.value.domain,
      componentData.value.storyUid
    );

    if (renderedStoryWidgetSrc !== storyWidgetSrc) {

      $element.attr('data-rendered-story-widget-url', storyWidgetSrc);

      Promise.resolve($.get(storyWidgetSrc)).
        then(
          function(storyWidgetData) {
            _renderStoryWidget($element, componentData, storyWidgetData);
          },
          function(error) {
            _renderStoryWidgetError($element, componentData);
          }
        ).
        catch(
          function(error) {
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

    utils.assert(
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
    var $widgetImage;
    var $widgetDescription;
    var $widgetViewStory;

    utils.assertHasProperty(componentData, 'type');

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
        'class': 'story-widget-container theme-{0}'.format(
          storyWidgetData.theme
        )
      }
    );

    $widgetContent = $('<div>', {'class': 'story-widget typeset'});

    $widgetTitle = $('<h2>', {'class': 'story-widget-title' }).
      text(storyWidgetData.title);

    if (storyWidgetData.image !== null) {
      $widgetImage = $(
        '<img>',
        {
          'class': 'story-widget-image',
          'style': 'background-image:url("{0}");'.format(storyWidgetData.image)
        }
      );
    }

    $widgetDescription = $('<p>', {'class': 'story-widget-description'})

    if (storyWidgetData.description !== null) {
      $widgetDescription.text(storyWidgetData.description);
    }

    $widgetViewStory = $(
      '<div>',
      {'class': 'story-widget-view-story'}
    ).html(
      '&mdash; {0} &mdash;'.format(root.I18n.t('editor.story_widget.view_story_prompt'))
    );

    $widgetContent.append([
      $widgetTitle,
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

    utils.assertHasProperty(componentData, 'type');

    $element.
      empty().
      text(JSON.stringify(error));
  }

  function componentStoryWidget(componentData, theme, options) {
    var $this = $(this);
    var rerenderOnResizeTimeout;

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'story.widget',
      'componentStoryWidget: Unsupported component type {0}'.format(
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

    $this.addClass(utils.typeToClassNameForComponentType(componentData.type));
    $this.componentBase(componentData, theme, options);

    $(window).on('resize', _handleWindowResize);

    $this.on('destroy', function() {
      $(window).off('resize', _handleWindowResize);
      $this.empty();
    });

    return $this;
  }

  $.fn.componentStoryWidget = componentStoryWidget;
})(window, jQuery);
