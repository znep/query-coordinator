import _ from 'lodash';
import $ from 'jquery';

import '../componentBase';
import StorytellerUtils from '../../StorytellerUtils';

$.fn.componentYoutubeVideo = componentYoutubeVideo;

export default function componentYoutubeVideo(props) {
  const $this = $(this);
  const { componentData } = props;

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'youtube.video',
    `componentYoutubeVideo: Unsupported component type ${componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderYoutube($this, componentData);
  }

  _updateSrcAndTitle($this, componentData);
  $this.componentBase(props);

  return $this;
}

function _renderYoutube($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  const $iframeElement = $(
    '<iframe>',
    {
      'src': 'about:blank',
      'frameborder': '0',
      'allowfullscreen': true
    }
  );
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);

  $element.
    addClass(className).
    append($iframeElement);
}

function _updateSrcAndTitle($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'id');

  const $iframeElement = $element.find('iframe');
  const title = _.get(componentData.value, 'title');
  const youtubeSource = StorytellerUtils.generateYoutubeIframeSrc(componentData.value.id);

  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== youtubeSource) {
    $iframeElement.attr('src', youtubeSource);
  }
}
