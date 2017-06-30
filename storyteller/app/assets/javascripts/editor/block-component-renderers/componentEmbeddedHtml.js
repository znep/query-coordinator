import $ from 'jquery';
import _ from 'lodash';
import bowser from 'bowser';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperty, assertHasProperties } from 'common/js_utils';
import Environment from '../../StorytellerEnvironment';

$.fn.componentEmbeddedHtml = componentEmbeddedHtml;

export default function componentEmbeddedHtml(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.HTMLEMBED
    }
  });

  const { componentData } = props;

  assertHasProperties(componentData, 'type');
  assert(
    componentData.type === 'embeddedHtml',
    `componentEmbeddedHtml: Unsupported component type ${componentData.type}`
  );

  if (this.children().length === 0) {
    renderEmbeddedHtml(this, componentData);
  }

  updateMobileExperience(this);
  updateSrcAndTitle(this, componentData);
  updateIframeHeight(this, componentData);

  this.componentBase(props);

  return this;
}

function renderEmbeddedHtml($element, componentData) {
  assertHasProperty(componentData, 'type');

  const $iframeElement = $(
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
    mouseenter(() => $element.addClass('active')).
    mouseleave(() => $element.removeClass('active'));
}

/**
 * Embedded HTML has some quirks related to diverging mobile browsing
 * <iframe> implementations. This adds a mobile webkit detection mutation
 * that allows us to make targeted adjustments to deal with these quirks.
 *
 * You can read about it more by searching Jira for EN-16293.
 */
function updateMobileExperience($element) {
  if (bowser.webkit && (bowser.mobile || bowser.tablet)) {
    $element.addClass('mobile-webkit');
    $element.find('iframe').attr('scrolling', 'no');
  } else {
    $element.removeAttr('scrolling').removeClass('mobile-safari');
  }
}

function updateSrcAndTitle($element, componentData) {
  assertHasProperty(componentData, 'value');
  assertHasProperty(componentData.value, 'url');

  const embeddedHtmlUrl = componentData.value.url;
  const documentId = componentData.value.documentId;
  const $iframeElement = $element.find('iframe');

  // We want to eventually check for this, but there was a bug where we weren't saving this to the
  // database for embeddedHtml elements. Moving forward we will, and may choose to migrate old
  // data to fix the problem. -SR
  // utils.assertHasProperty(componentData.value, 'documentId');

  const title = _.get(componentData.value, 'title');
  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== embeddedHtmlUrl || $iframeElement.attr('data-document-id') !== String(documentId)) {
    $iframeElement.attr('src', embeddedHtmlUrl);
    $iframeElement.attr('data-document-id', documentId);
  }
}

function updateIframeHeight($element, componentData) {
  const $iframeElement = $element.find('iframe');
  const renderedHeight = parseInt($iframeElement.attr('height'), 10);

  assertHasProperty(componentData, 'value');
  assertHasProperty(componentData.value, 'layout');
  assertHasProperty(componentData.value.layout, 'height');

  if (renderedHeight !== componentData.value.layout.height) {
    $iframeElement.attr('height', componentData.value.layout.height);
  }
}

