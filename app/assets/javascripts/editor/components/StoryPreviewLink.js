import $ from 'jQuery';

import { storySaveStatusStore } from '../stores/StorySaveStatusStore';

$.fn.storyPreviewLink = StoryPreviewLink;

export default function StoryPreviewLink() {
  var $this = $(this);
  var disabled = false;

  function render() {
    $this.toggleClass('disabled', disabled);
  }

  storySaveStatusStore.addChangeListener(function() {
    disabled = storySaveStatusStore.isStoryDirty();
    render();
  });
  render();

  $this.on('click', function(event) {
    if (disabled) {
      event.preventDefault();
    }
  });

  return this;
}
