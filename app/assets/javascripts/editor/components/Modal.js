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
(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

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
          'class': 'icon-cross2'
        }
      )
    );
  }



  $.fn.modal = function(options) {
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
        addClass('modal').
        on('modal-open', function() { self.removeClass('hidden'); }).
        on('modal-close', function() { self.addClass('hidden'); }).
        // Do not scroll page if the container is scrolled
        on('mousewheel', utils.preventScrolling);

      $(document).on('keyup', function(event) {
        // `ESC`
        if (event.keyCode === 27) {
          _emitDismissed();
        }
      });

      this.trigger('modal-close');
    }

    this.find('.modal-title').text(options.title);

    if (this.data('modal-rendered-content') !== options.content) {
      this.data('modal-rendered-content', options.content);
      this.find('.modal-content').empty().append(options.content);
    }


    function _emitDismissed() {
      self.trigger('modal-dismissed');
    }

    return this;
  };

}(jQuery, window));
