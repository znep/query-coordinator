import Clipboard from 'clipboard';

export const isCopyingSupported = document.queryCommandSupported &&
  document.queryCommandSupported('copy');

// Set up "copy to clipboard" for an element.  This is shared is ApiModal and ODataModal
export function initClipboardControl(selector) {
  const copyButton = new Clipboard(selector, {
    text: (trigger) => $(trigger).closest('form').find('input').val()
  });

  copyButton.on('success', (event) => {
    const $button = $(event.trigger);
    const copyText = $button.text();

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
