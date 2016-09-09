import Clipboard from 'clipboard';

export var isCopyingSupported = document.queryCommandSupported &&
  document.queryCommandSupported('copy');

// Set up "copy to clipboard" for an element.  This is shared is ApiFlannel and ODataModal
export function initClipboardControl(selector) {
  var copyButton = new Clipboard(selector, {
    text: (trigger) => $(trigger).closest('form').find('input').val()
  });

  copyButton.on('success', (event) => {
    var $button = $(event.trigger);
    var copyText = $button.text();

    $button.
      addClass('btn-success').
      text($button.data('confirmation'));

    // Revert to pre-copy state after 2 seconds
    window.setTimeout(() => {
      $button.
        removeClass('btn-success').
        text(copyText);
    }, 2000);
  });
}
