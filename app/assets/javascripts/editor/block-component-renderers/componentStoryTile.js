import $ from 'jQuery';

import '../componentBase';
import I18n from '../I18n';
import StorytellerUtils from '../../StorytellerUtils';

var WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.componentStoryTile = componentStoryTile;

export default function componentStoryTile(componentData, theme, options) {
  var $this = $(this);
  var rerenderOnResizeTimeout;

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'story.tile' || componentData.type === 'story.widget',
    StorytellerUtils.format(
      'componentStoryTile: Unsupported component type {0}',
      componentData.type
    )
  );

  function _handleWindowResize() {
    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      _renderStoryTile($this, componentData),
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
  var storyTileSrc;
  var renderedStoryTileSrc = $element.attr('data-rendered-story-tile-url');

  StorytellerUtils.assertHasProperties(
    componentData,
    'value.domain',
    'value.storyUid'
  );

  storyTileSrc = StorytellerUtils.generateStoryTileJsonSrc(
    componentData.value.domain,
    componentData.value.storyUid
  );

  if (renderedStoryTileSrc !== storyTileSrc) {

    // Although we do some basic validation on the user input,
    // since we must support arbitrary customer domains `storyTileSrc`
    // can point to any domain. Accordingly, this is a potential phishing
    // risk.
    $element.attr('data-rendered-story-tile-url', storyTileSrc);

    Promise.resolve($.get(storyTileSrc)).
      then(
        function(storyTileData) {
          _renderStoryTile($element, componentData, storyTileData);
        }
      ).
      catch(
        function(error) {

          if (window.console && console.error) {
            console.error(error);
          }

          _renderStoryTileError($element);
        }
      );
  }
}

function _updateTextEllipsification($element) {
  var renderedResponse = $element.attr('data-rendered-story-tile-data');
  var renderedWidth = parseInt($element.attr('data-rendered-story-tile-width'), 10);
  var elementWidth = Math.floor($element.outerWidth(true));
  var storyTileData;
  var $tileTitle;
  var $tileDescription;

  if (renderedResponse && renderedWidth !== elementWidth) {

    storyTileData = JSON.parse(renderedResponse);

    $element.attr('data-rendered-story-tile-width', elementWidth);

    $tileTitle = $element.find('.story-tile-title');
    $tileTitle.text(storyTileData.title);

    StorytellerUtils.ellipsifyText($tileTitle, 2);
    $tileDescription = $element.find('.story-tile-description');

    if (storyTileData.description !== null) {

      $tileDescription.text(storyTileData.description);
      StorytellerUtils.ellipsifyText($tileDescription, 3);
    }
  }
}

function _renderStoryTile($element, componentData, storyTileData) {
  var $tileContainer;
  var $tileContent;
  var $tileTitle;
  var $tileTitleContainer;
  var $tileImage;
  var $tileDescription;
  var $tileViewStory;

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assertHasProperty(componentData, 'value');

  // If there is no story tile data provided we just want to re-ellipsify
  // the text (which we can do by mutating rather than wiping out the entire
  // entire component subtree), but only in the case that the width of
  // the container has changed (doing so more often is not great for
  // performance).
  if (!storyTileData) {

    _updateTextEllipsification($element);
    return;
  }

  _removeStoryTile($element);

  $element.attr(
    'data-rendered-story-tile-data',
    JSON.stringify(storyTileData)
  );

  $tileContainer = $(
    '<a>',
    {
      'href': storyTileData.url,
      'target': componentData.value.openInNewWindow ? '_blank' : '_self',
      'class': 'story-tile-container'
    }
  );

  $tileContent = $('<div>', {'class': 'story-tile typeset'});

  $tileTitle = $('<h2>', {'class': 'story-tile-title' }).
    text(storyTileData.title);

  $tileTitleContainer = $('<div>', {'class': 'story-tile-title-container'}).
    append($tileTitle);

  $tileImage = $(
    '<div>',
    {
      'class': 'story-tile-image'
    }
  );

  if (storyTileData.image !== null) {
    $tileImage.attr('style', StorytellerUtils.format('background-image:url({0})', storyTileData.image));
  }

  $tileDescription = $('<p>', {'class': 'story-tile-description'});

  if (storyTileData.description !== null) {
    $tileDescription.text(storyTileData.description);
  }

  $tileViewStory = $('<div>', {'class': 'story-tile-view-story'}).
    text(I18n.t('editor.story_tile.view_story_prompt'));

  $tileContent.append([
    $tileTitleContainer,
    $tileImage,
    $tileDescription,
    $tileViewStory
  ]);

  $tileContainer.append($tileContent);

  $element.append($tileContainer);

  StorytellerUtils.ellipsifyText($tileTitle, 2);

  if ($tileDescription) {
    StorytellerUtils.ellipsifyText($tileDescription, 3);
  }

  $tileContainer.addClass('rendered');
}

function _removeStoryTile($element) {

  $element.
    removeClass('component-error').
    children().
    // Don't accidentally remove the edit control when trying to clear the
    // component's DOM tree in order to re-render it.
    not('.component-edit-controls').
    remove();
}

function _renderStoryTileError($element) {

  $element.
    children(':not(.component-edit-controls)').
    remove();

  $element.
    addClass('component-error').
    append([
      $('<p>').text(I18n.t('editor.story_tile.invalid_permissions'))
    ]);
}
