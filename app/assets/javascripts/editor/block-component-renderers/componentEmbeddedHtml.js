(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderEmbeddedHtml($element, componentData) {

    utils.assertHasProperty(componentData, 'type');

    var $iframeElement = $(
      '<iframe>',
      {
        'src': 'about:blank',
        'frameborder': '0',
        'data-document-id': null
      }
    );

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      append($iframeElement);
  }

  function _updateSrc($element, componentData) {

    var embeddedHtmlUrl;
    var documentId;
    var $iframeElement = $element.find('iframe');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'url');

    // We want to eventually check for this, but there was a bug where we weren't saving this to the
    // database for embeddedHtml elements. Moving forward we will, and may choose to migrate old
    // data to fix the problem. -SR
    // utils.assertHasProperty(componentData.value, 'documentId');

    embeddedHtmlUrl = componentData.value.url;
    documentId = componentData.value.documentId;

    if ($iframeElement.attr('src') !== embeddedHtmlUrl || $iframeElement.attr('data-document-id') !== String(documentId)) {
      $iframeElement.attr('src', embeddedHtmlUrl);
      $iframeElement.attr('data-document-id', documentId);
    }
  }

  function _updateIframeHeight($element, componentData) {

    var $iframeElement = $element.find('iframe');
    var renderedHeight = parseInt($iframeElement.attr('height'), 10);

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'layout');
    utils.assertHasProperty(componentData.value.layout, 'height');

    if (renderedHeight !== componentData.value.layout.height) {
      $iframeElement.attr('height', componentData.value.layout.height);
    }
  }

  function componentEmbeddedHtml(componentData, theme, options) {

    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'embeddedHtml',
      'componentEmbeddedHtml: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    if ($this.children().length === 0) {
      _renderEmbeddedHtml($this, componentData);
    }

    _updateSrc($this, componentData);
    _updateIframeHeight($this, componentData);
    $this.componentEditButton();
    $this.toggleClass('editing', _.get(options, 'editMode', false));

    return $this;
  }

  $.fn.componentEmbeddedHtml = componentEmbeddedHtml;
})(window, jQuery);

