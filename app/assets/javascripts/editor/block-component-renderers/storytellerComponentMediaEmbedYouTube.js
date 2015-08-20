(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderYouTubeEmbed($element) {
    var $iframeElement = $(
      '<iframe>',
      {
        'src': 'about:blank',
        'frameborder': '0',
        'allowfullscreen': true
      }
    );

    $element.
      addClass('embed').
      addClass('youtube').
      attr('data-rendered-media-type', 'embed').
      attr('data-rendered-media-embed-provider', 'youtube');


    $element.append($iframeElement);
  }

  function _updateSrc($element, youTubeVideoId) {
    var $iframeElement = $element.find('iframe');
    var youTubeSource = utils.generateYouTubeIframeSrc(youTubeVideoId);

    if ($iframeElement.attr('src') !== youTubeSource) {
      $iframeElement.attr('src', youTubeSource);
    }
  }

  function storytellerComponentMediaEmbedYouTube(componentData) {
    var $self = $(this);

    if (componentData.value.value.provider !== 'youtube') {
      throw new Error('YouTube: Tried to render provider type: {0}'.format(
        componentData.value.value.provider
      ));
    }

    if ($self.children().length === 0) {
      _renderYouTubeEmbed($self);
    }

    _updateSrc($self, componentData.value.value.id);

    return $self;
  }

  $.fn.storytellerComponentMediaEmbedYouTube = storytellerComponentMediaEmbedYouTube;
})(window, jQuery);
