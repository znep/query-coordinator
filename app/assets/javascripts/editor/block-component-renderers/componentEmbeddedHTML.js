(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderEmbeddedHTML($element, componentData) {

    utils.assertHasProperty(componentData, 'type');

    var $iframeElement = $(
      '<iframe>',
      {
        'src': 'about:blank',
        'frameborder': '0'
      }
    );

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      append($iframeElement);
  }

  function _updateSrc($element, componentData) {

    var embeddedHtmlUrl;
    var $iframeElement = $element.find('iframe');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'url');

    embeddedHtmlUrl = componentData.value.url;

    if ($iframeElement.attr('src') !== embeddedHtmlUrl) {
      $iframeElement.attr('src', embeddedHtmlUrl);
    }
  }

  function componentEmbeddedHTML(componentData) {

    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'embeddedHTML',
      'componentEmbeddedHTML: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    if ($this.children().length === 0) {
      _renderEmbeddedHTML($this, componentData);
    }

    _updateSrc($this, componentData);

    return $this;
  }

  $.fn.componentEmbeddedHTML = componentEmbeddedHTML;
})(window, jQuery);

