(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;

  function _renderYoutubeEmbed($element) {
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

  function storytellerComponentMediaEmbedYoutube(componentData) {
    var $self = $(this);

    if (componentData.value.value.provider !== 'youtube') {
      throw new Error('Youtube: Tried to render provider type: {0}'.format(
        componentData.value.value.provider
      ));
    }

    if ($self.children().length === 0) {
      _renderYoutubeEmbed($self);
    }

    _updateSrc($self, componentData.value.value.id);

    return $self;
  }

  $.fn.storytellerComponentMediaEmbedYoutube = storytellerComponentMediaEmbedYoutube;
})(window, jQuery);
