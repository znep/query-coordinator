import $ from 'jQuery';

import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from '../stores/StoryStore';

$.fn.storyTitle = StoryTitle;

export default function StoryTitle(storyUid) {

  StorytellerUtils.assertIsOneOfTypes(storyUid, 'string');

  var titleNodes = this;

  function render() {
    titleNodes.each(function() {
      var title = storyStore.getStoryTitle(storyUid);

      $(this).
        text(title).
        attr('title', title);
    });
  }

  storyStore.addChangeListener(render);
  render();

  return this;
}
