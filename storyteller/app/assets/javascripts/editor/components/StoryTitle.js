import $ from 'jquery';

import { assertIsOneOfTypes } from 'common/js_utils';
import { storyStore } from '../stores/StoryStore';

$.fn.storyTitle = StoryTitle;

export default function StoryTitle(storyUid) {

  assertIsOneOfTypes(storyUid, 'string');

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
    if (!storyStore.doesStoryExist(storyUid)) {
      return null; // Story not loaded yet.
    }

    const title = storyStore.getStoryTitle(storyUid);

    $title.
      text(title).
      attr('title', title);
  }

  storyStore.addChangeListener(render);

  attachEvents();
  render();

  return this;
}
