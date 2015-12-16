(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function StoryCopierRenderer(options) {
    var _container = options.storyCopierContainerElement || null;
    var _overlay = $('<div>', { 'class': 'modal-overlay' });
    var _dialog = $('<div>', { 'class': 'modal-dialog' });
    var _rendered = false;

    if (!(_container instanceof jQuery)) {

      throw new Error(
        '`options.storyCopierContainerElement` ' +
        'must be a jQuery element (is of type ' +
        (typeof _container) +
        ').'
      );
    }

    _container.append([ _overlay, _dialog ]);

    _listenForChanges();
    _attachEvents();

    /**
     * Private methods
     */

    function _listenForChanges() {

      storyteller.storyCopierStore.addChangeListener(function() {
        _renderModal();
      });
    }

    function _attachEvents() {

      $(document).on('keyup', function(event) {

        switch (event.keyCode) {

          // `ESC`
          case 27:
            storyteller.dispatcher.dispatch({
              action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
            });
            break;

          default:
            break;
        }
      });

      // Do not scroll page if the container is scrolled
      _container.on('mousewheel', utils.preventScrolling);

      _overlay.on('click', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
        });
      });

      _dialog.on('click', '[data-action]', function() {
        var action = this.getAttribute('data-action');

        switch (action) {
          case Actions.STORY_MAKE_COPY_MODAL_SUBMIT:
          case Actions.STORY_MAKE_COPY_MODAL_CANCEL:
            storyteller.dispatcher.dispatch({
              action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
            });
            break;

          default:
            break;
        }
      });
    }

    function _renderModal() {
      var isOpen = storyteller.storyCopierStore.getCurrentOpenState();

      if (!_rendered) {
        _dialog.html(_renderModalContents());
        _rendered = true;
      }

      if (isOpen) {
        _showModal();
      } else {
        _hideModal();
      }
    }

    function _showModal() {
      _container.removeClass('hidden');

      var storyTitle = storyteller.storyStore.getStoryTitle(storyteller.userStoryUid);
      _dialog.find('input.make-a-copy-title-input').val('Copy of {0}'.format(storyTitle));
      _dialog.find('input.make-a-copy-title-input').select();
    }

    function _hideModal() {
      _container.addClass('hidden');
    }

    function _renderModalTitle(titleText) {
      return $('<h1>', { 'class': 'modal-title' }).text(titleText);
    }

    function _renderModalCloseButton() {
      return $(
        '<button>',
        {
          'class': 'modal-close-btn',
          'data-action': Actions.STORY_MAKE_COPY_MODAL_CANCEL
        }
      ).append(
        $(
          '<span>',
          {
            'class': 'icon-cross2',
            'data-action': Actions.STORY_MAKE_COPY_MODAL_CANCEL
          }
        )
      );
    }

    function _renderModalContents() {

      var heading = _renderModalTitle(
          I18n.t('editor.make_a_copy.title')
      );

      var closeButton = _renderModalCloseButton();

      var inputField = $('<input>', {
        'class': 'make-a-copy-title-input',
        'name': 'title',
        'type': 'text',
        'maxlength': 255
      });

      var copyWarning = $('<p>', {
        'class': 'make-a-copy-copy-warning'
      }).text(I18n.t('editor.make_a_copy.copy_warning'));

      var cancelButton = $('<button>', {
        'class': 'btn-default btn-inverse back-btn',
        'data-action': Actions.STORY_MAKE_COPY_MODAL_CANCEL,
        'type': 'button'
      }).text(I18n.t('editor.make_a_copy.cancel'));

      var copyButton = $('<button>', {
        'class': 'btn-primary',
        'data-action': Actions.STORY_MAKE_COPY_MODAL_SUBMIT,
        'type': 'submit'
      }).text(I18n.t('editor.make_a_copy.make_copy'));

      var buttons = $('<div>', {
        'class': 'make-a-copy-button-group r-to-l'
      }).append([cancelButton, copyButton]);

      var form = $('<form>', {
        'method': 'GET',
        'action': '/stories/s/{uid}/copy'.format({ uid: storyteller.userStoryUid }),
        'target': '_blank'
      }).append([ inputField, copyWarning, buttons ]);

      var content = $('<div>', { 'class': 'modal-content' }).append(form);

      return [ heading, closeButton, content ];
    }
  }

  root.socrata.storyteller.StoryCopierRenderer = StoryCopierRenderer;
})(window);

