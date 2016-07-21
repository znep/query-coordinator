import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import Environment from '../../StorytellerEnvironment';

$.fn.componentEmbeddedHtml = componentEmbeddedHtml;

export default function componentEmbeddedHtml(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'embeddedHtml',
    StorytellerUtils.format(
      'componentEmbeddedHtml: Unsupported component type {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderEmbeddedHtml($this, componentData);
  }

  _updateSrcAndTitle($this, componentData);
  _updateIframeHeight($this, componentData);
  $this.componentBase(componentData, theme, _.extend(
    {
      resizeSupported: true,
      resizeOptions: {
        minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.HTMLEMBED
      }
    },
    options
  ));

  return $this;
}

function _renderEmbeddedHtml($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var $iframeElement = $(
    '<iframe>',
    {
      'src': 'about:blank',
      'frameborder': '0',
      'data-document-id': null,
      'sandbox': Environment.EMBED_CODE_SANDBOX_IFRAME_ALLOWANCES
    }
  );

  $element.
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    append($iframeElement);

  $iframeElement.
    mouseenter(function() {
      $element.addClass('active');
    }).
    mouseleave(function() {
      $element.removeClass('active');
    });
}

function _updateSrcAndTitle($element, componentData) {
  var embeddedHtmlUrl;
  var documentId;
  var $iframeElement = $element.find('iframe');

  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'url');

  // We want to eventually check for this, but there was a bug where we weren't saving this to the
  // database for embeddedHtml elements. Moving forward we will, and may choose to migrate old
  // data to fix the problem. -SR
  // utils.assertHasProperty(componentData.value, 'documentId');

  embeddedHtmlUrl = componentData.value.url;
  documentId = componentData.value.documentId;

  var title = _.get(componentData.value, 'title');
  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== embeddedHtmlUrl || $iframeElement.attr('data-document-id') !== String(documentId)) {
    $iframeElement.attr('src', embeddedHtmlUrl);
    $iframeElement.attr('data-document-id', documentId);
  }
}

function _updateIframeHeight($element, componentData) {
  var $iframeElement = $element.find('iframe');
  var renderedHeight = parseInt($iframeElement.attr('height'), 10);

  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'layout');
  StorytellerUtils.assertHasProperty(componentData.value.layout, 'height');

  if (renderedHeight !== componentData.value.layout.height) {
    $iframeElement.attr('height', componentData.value.layout.height);
  }
}

