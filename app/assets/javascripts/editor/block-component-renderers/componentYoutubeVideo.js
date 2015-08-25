(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderYoutube($element, componentData) {

    utils.assertHasProperty(componentData, 'type');

    var $iframeElement = $(
      '<iframe>',
      {
        'src': 'about:blank',
        'frameborder': '0',
        'allowfullscreen': true
      }
    );

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      append($iframeElement);
  }

  function _updateSrc($element, componentData) {

    var youtubeSource;
    var $iframeElement = $element.find('iframe');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'id');

    youtubeSource = utils.generateYoutubeIframeSrc(componentData.value.id);

    if ($iframeElement.attr('src') !== youtubeSource) {
      $iframeElement.attr('src', youtubeSource);
    }
  }

  function componentYoutubeVideo(componentData) {

    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'youtube.video',
      'componentYoutubeVideo: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    if ($this.children().length === 0) {
      _renderYoutube($this, componentData);
    }

    _updateSrc($this, componentData);

    return $this;
  }

  $.fn.componentYoutubeVideo = componentYoutubeVideo;
})(window, jQuery);
