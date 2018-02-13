import $ from 'jquery';

/*
 * A component that renders a modal. It is very dumb. It's entirely up
 * to you to open and close the modal at the appropriate time.
 *
 * It is safe to call .modal() multiple times on a node, the configuration
 * will just be updated.
 *
 * To provide better behavior for scrollable content within the modal,
 * the modal will prevent the mouse wheel from scrolling the main page.
 *
 * Example usage:
 * $('#my-modal').
 *   modal(
 *     {
 *       title: 'optional',
 *       content: $('<div>')...,
 *       wide: true // Make the modal wider. Defaults to false.
 *     }
 *   ).
 *   trigger('modal-open').
 *   on('modal-dismissed', function() {
 *     this.trigger('modal-close');
 *   });
 *
 * NOTE: The modal is closed by default. Open it with .trigger('modal-open').
 *
 * Triggers:
 *  modal-open: Open the modal.
 *  modal-close: Close the modal.
 *
 * Events:
 *  modal-dismissed: The user has indicated a desire to close the modal
 *                   (ESC pressed, X button clicked, overlay clicked).
 *                   Note that it's up to the developer to actually close
 *                   the modal (via .trigger('modal-close')).
 */
$.fn.modal = Modal;

export default function Modal(options) {
  var self = this;

  options = options || {};

  if (!this.data('modal-rendered')) {
    // Initial setup.
    this.append(
      $('<div>', { 'class': 'modal-overlay' }).on('click', _emitDismissed),
      $('<div>', { 'class': 'modal-dialog' }).
        append(
          $('<div>', { 'class': 'modal-header-group' }).
            append(
              $('<h1>', { 'class': 'modal-title' }),
              _renderModalCloseButton().on('click', _emitDismissed)
            ),
          $('<div>', { 'class': 'modal-content' })
        )
    );

    this.
      data('modal-rendered', true).
      addClass('storyteller-modal').
      on('modal-destroy', () => {
        this.data('modal-rendered', null).data('modal-rendered-content', null).empty();
      }).
      on('modal-open', function() {
        self.removeClass('hidden');
        $('html').addClass('modal-open');
      }).
      on('modal-close', function() {
        self.addClass('hidden');
        $('html').removeClass('modal-open');
      });

    $(document).on('keyup', function(event) {
      // `ESC`
      if (event.keyCode === 27) {
        self.trigger('modal-dismissed');
      }
    });

    this.trigger('modal-close');
  }

  this.find('.modal-title').html(options.title);
  this.find('.modal-dialog').toggleClass('modal-dialog-wide', !!options.wide);

  if (this.data('modal-rendered-content') !== options.content) {
    this.data('modal-rendered-content', options.content);
    this.find('.modal-content').empty().append(options.content);
  }


  function _emitDismissed(event) {
    var isOutsideModalDialog = $(event.target).closest('.modal-dialog').length === 0;
    var isInsideHtml = $(event.target).closest('html').length === 1;
    var isModalCloseButton = $(event.target).hasClass('modal-close-btn') || $(event.target).closest('.modal-close-btn').length === 1;

    if ((isOutsideModalDialog && isInsideHtml) || isModalCloseButton) {
      self.trigger('modal-dismissed');
    }
  }

  return this;
}

function _renderModalCloseButton() {
  return $(
    '<button>',
    {
      'class': 'modal-close-btn'
    }
  ).append(
    $(
      '<span>',
      {
        'class': 'socrata-icon-close-2'
      }
    )
  );
}
