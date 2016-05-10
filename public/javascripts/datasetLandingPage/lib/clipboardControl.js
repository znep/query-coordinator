import Clipboard from 'clipboard';

// Set up "copy to clipboard" for an element.  This is shared is ApiFlannel and ODataModal
export default function(selector) {
  var copyButton = new Clipboard(selector, {
    text: function(trigger) {
      return $(trigger).closest('form').find('input').val();
    }
  });

  copyButton.on('success', function(event) {
    var $button = $(event.trigger);
    var copyText = $button.text();

    $button.
      addClass('btn-success').
      text($button.data('confirmation'));

    // Revert to pre-copy state after 2 seconds
    window.setTimeout(function() {
      $button.
        removeClass('btn-success').
        text(copyText);
    }, 2000);
  });
}
