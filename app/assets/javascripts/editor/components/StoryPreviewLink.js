import $ from 'jQuery';

import { storySaveStatusStore } from '../stores/StorySaveStatusStore';

$.fn.storyPreviewLink = StoryPreviewLink;

export default function StoryPreviewLink() {
  var $this = $(this);
  var disabled = false;

  function render() {
    $this.toggleClass('disabled', disabled);
    $this.prop('disabled', disabled);
  }

  storySaveStatusStore.addChangeListener(function() {
    disabled = storySaveStatusStore.isStoryDirty();
    render();
  });
  render();

  $this.on('click', function(event) {
    if (disabled) {
      event.preventDefault();
    } else {
      window.open(event.target.getAttribute('data-href'), '_blank');
    }
  });

  return this;
}
