/*
 * A component that renders a story title.
 */
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  $.fn.storyPreviewLink = function() {
    var $this = $(this);
    var disabled = false;

    function render() {
      $this.toggleClass('disabled', disabled);
    }

    storyteller.storySaveStatusStore.addChangeListener(function() {
      disabled = storyteller.storySaveStatusStore.isStoryDirty();
      render();
    });
    render();

    $this.on('click', function(event) {
      if (disabled) {
        event.preventDefault();
      }
    });

    return this;
  };

}(jQuery, window));

