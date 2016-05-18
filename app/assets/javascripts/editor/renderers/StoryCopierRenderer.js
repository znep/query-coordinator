import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { storyStore } from '../stores/StoryStore';
import { storyCopierStore } from '../stores/StoryCopierStore';

export default function StoryCopierRenderer(options) {
  var _container = options.storyCopierContainerElement || null;
  var _rendered = false;

  StorytellerUtils.assertInstanceOf(_container, $);

  _listenForChanges();
  _attachEvents();

  /**
   * Private methods
   */

  function _listenForChanges() {
    storyCopierStore.addChangeListener(_renderModal);
  }

  function _attachEvents() {
    _container.on('modal-dismissed', function() {
      dispatcher.dispatch({
        action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
      });
    });

    _container.on('click', '[data-action]', function() {
      var action = this.getAttribute('data-action');

      switch (action) {
        case Actions.STORY_MAKE_COPY_MODAL_SUBMIT:
        case Actions.STORY_MAKE_COPY_MODAL_CANCEL:
          dispatcher.dispatch({
            action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
          });
          break;

        default:
          break;
      }
    });
  }

  function _renderModal() {
    var isOpen = storyCopierStore.getCurrentOpenState();

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
    var storyTitle = storyStore.getStoryTitle(Environment.STORY_UID);

    _container.find('input.make-a-copy-title-input').val(
      StorytellerUtils.format('Copy of {0}', storyTitle)
    );
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
      'class': 'btn-default back-btn',
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
      'action': StorytellerUtils.format('/stories/s/{uid}/copy', { uid: Environment.STORY_UID }),
      'target': '_blank'
    }).append([ inputField, copyWarning, buttons ]);

    return form;
  }
}
