(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  function StoryCopierRenderer(options) {
    var _container = options.storyCopierContainerElement || null;
    var _rendered = false;

    if (!(_container instanceof jQuery)) {

      throw new Error(
        '`options.storyCopierContainerElement` ' +
        'must be a jQuery element (is of type ' +
        (typeof _container) +
        ').'
      );
    }

    _listenForChanges();
    _attachEvents();

    /**
     * Private methods
     */

    function _listenForChanges() {

      storyteller.storyCopierStore.addChangeListener(_renderModal);
    }

    function _attachEvents() {
      _container.on('modal-dismissed', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
        });
      });

      _container.on('click', '[data-action]', function() {
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
        _container.modal({
          title: I18n.t('editor.make_a_copy.title'),
          content: _renderModalContents()
        });
        _rendered = true;
      }

      if (isOpen) {
        _showModal();
      } else {
        _hideModal();
      }
    }

    function _showModal() {
      var storyTitle = storyteller.storyStore.getStoryTitle(storyteller.userStoryUid);
      _container.find('input.make-a-copy-title-input').val('Copy of {0}'.format(storyTitle));
      _container.find('input.make-a-copy-title-input').select();

      _container.trigger('modal-open');
    }

    function _hideModal() {
      _container.trigger('modal-close');
    }

    function _renderModalContents() {

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

      return form;
    }
  }

  root.socrata.storyteller.StoryCopierRenderer = StoryCopierRenderer;
})(window);

