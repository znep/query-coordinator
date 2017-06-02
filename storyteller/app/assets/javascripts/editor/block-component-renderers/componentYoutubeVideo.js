import _ from 'lodash';
import $ from 'jquery';

import '../componentBase';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperties, assertHasProperty } from 'common/js_utils';

$.fn.componentYoutubeVideo = componentYoutubeVideo;

export default function componentYoutubeVideo(props) {
  const $this = $(this);
  const { componentData } = props;

  assertHasProperties(componentData, 'type');
  assert(
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
  assertHasProperty(componentData, 'type');

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
  assertHasProperty(componentData, 'value');
  assertHasProperty(componentData.value, 'id');

  const $iframeElement = $element.find('iframe');
  const title = _.get(componentData.value, 'title');
  const youtubeSource = StorytellerUtils.generateYoutubeIframeSrc(componentData.value.id);

  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== youtubeSource) {
    $iframeElement.attr('src', youtubeSource);
  }
}
