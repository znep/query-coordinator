import $ from 'jQuery';

import '../componentBase';
import StorytellerUtils from '../../StorytellerUtils';

$.fn.componentYoutubeVideo = componentYoutubeVideo;

export default function componentYoutubeVideo(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'youtube.video',
    StorytellerUtils.format(
      'componentYoutubeVideo: Unsupported component type {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderYoutube($this, componentData);
  }

  _updateSrcAndTitle($this, componentData);
  $this.componentBase(componentData, theme, options);

  return $this;
}

function _renderYoutube($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var $iframeElement = $(
    '<iframe>',
    {
      'src': 'about:blank',
      'frameborder': '0',
      'allowfullscreen': true
    }
  );
  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);

  $element.
    addClass(className).
    append($iframeElement);
}

function _updateSrcAndTitle($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'id');

  var $iframeElement = $element.find('iframe');
  var title = _.get(componentData.value, 'title');
  var youtubeSource = StorytellerUtils.generateYoutubeIframeSrc(componentData.value.id);

  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== youtubeSource) {
    $iframeElement.attr('src', youtubeSource);
  }
}
