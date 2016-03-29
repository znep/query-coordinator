import $ from 'jQuery';

import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from '../stores/StoryStore';

$.fn.storyTitle = StoryTitle;

export default function StoryTitle(storyUid) {

  StorytellerUtils.assertIsOneOfTypes(storyUid, 'string');

  var $title = $(this);

  function attachEvents() {
    $title.click(function() {
      $('#settings-panel-story-metadata button:not(.active)').
        click();

      $('#title').
        focus().
        select();
    });

  }

  function render() {
    var title = storyStore.getStoryTitle(storyUid);

    $title.
      text(title).
      attr('title', title);
  }

  storyStore.addChangeListener(render);

  attachEvents();
  render();

  return this;
}
