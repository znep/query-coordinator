import _ from 'lodash';
import $ from 'jquery';

import I18n from '../I18n';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import { assertInstanceOf } from 'common/js_utils';
import { dispatcher } from '../Dispatcher';
import { storyStore } from '../stores/StoryStore';
import { storyCopierStore } from '../stores/StoryCopierStore';

function t(key) {
  return I18n.t(`editor.make_a_copy.${key}`);
}

export default function StoryCopierRenderer(options) {
  const container = options.storyCopierContainerElement || null;
  let rendered = false;

  assertInstanceOf(container, $);

  listenForChanges();
  attachEvents();

  /**
   * Private methods
   */

  function listenForChanges() {
    storyCopierStore.addChangeListener(renderModal);
  }

  function attachEvents() {
    container.on('modal-dismissed', () => {
      dispatcher.dispatch({
        action: Actions.STORY_MAKE_COPY_MODAL_CANCEL
      });
    });

    container.on('click', '[data-action]', (event) => {
      const action = event.target.getAttribute('data-action');

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

  function renderModal() {
    const isOpen = storyCopierStore.getCurrentOpenState();

    if (!rendered) {
      container.modal({
        title: Environment.IS_GOAL ? t('title_goal') : t('title_story'),
        content: renderModalContents()
      });
      rendered = true;
    }

    if (isOpen) {
      showModal();
    } else {
      hideModal();
    }
  }

  function showModal() {
    const storyTitle = storyStore.getStoryTitle(Environment.STORY_UID);

    container.find('input.make-a-copy-title-input').
      val(t('copy_placeholder').format(storyTitle)).
      select();

    container.trigger('modal-open');
  }

  function hideModal() {
    container.trigger('modal-close');
  }

  function renderModalContents() {
    const inputField = $('<input>', {
      'class': 'make-a-copy-title-input text-input',
      'name': 'title',
      'type': 'text',
      'maxlength': 255
    });

    const copyWarning = $('<p>', {
      'class': 'make-a-copy-copy-warning'
    }).text(Environment.IS_GOAL ? t('copy_warning_goal') : t('copy_warning_story'));

    const cancelButton = $('<button>', {
      'class': 'btn btn-default back-btn',
      'data-action': Actions.STORY_MAKE_COPY_MODAL_CANCEL,
      'type': 'button'
    }).text(t('cancel'));

    const copyButton = $('<button>', {
      'class': 'btn btn-primary',
      'data-action': Actions.STORY_MAKE_COPY_MODAL_SUBMIT,
      'type': 'submit'
    }).text(t('copy'));

    const buttons = $('<div>', {
      'class': 'make-a-copy-button-group r-to-l'
    }).append([cancelButton, copyButton]);

    const formUrl = Environment.IS_GOAL ?
      `/stat/goals/single/${Environment.STORY_UID}/copy` :
      `/stories/s/${Environment.STORY_UID}/copy`;
    const form = $('<form>', {
      'method': 'GET',
      'action': formUrl,
      'target': '_blank'
    }).append([ inputField, copyWarning, buttons ]);

    // Goals get an extra widget to pick where the copied goal will live.
    // A disabled input is used instead of a dropdown if there's only one dashboard.
    if (Environment.IS_GOAL) {
      const dashboardLabel = $('<h2>', {
        'class': 'input-label modal-input-label'
      }).text(t('dashboard'));

      const dashboardSelector = $('<div>', {
        'class': 'goal-copy-dashboard-selector'
      });

      if (Environment.OP_DASHBOARD_LIST.length > 1) {
        // If there are multiple dashboards, selection occurs via dropdown.
        const dashboardDropdown = $(`
          <div class="modal-select">
            <select name="dashboard_uid"></select>
          </div>
        `);
        dashboardDropdown.find('select').append(_.map(
          _.sortBy(Environment.OP_DASHBOARD_LIST, ['name']),
          (dashboard) => {
            return $('<option>', {
              'value': dashboard.id,
              'selected': dashboard.id === Environment.OP_DASHBOARD_UID
            }).text(dashboard.name);
          }
        ));

        dashboardSelector.append([dashboardLabel, dashboardDropdown]);
      } else {
        // Otherwise, use a disabled input to select the dashboard.
        const dashboard = Environment.OP_DASHBOARD_LIST[0];

        const dashboardInputVisible = $('<input>', {
          'type': 'text',
          'class': 'text-input',
          'disabled': true,
          'value': dashboard.name
        });

        const dashboardInputHidden = $('<input>', {
          'type': 'text',
          'name': 'dashboard_uid',
          'disabled': true,
          'hidden': true,
          'value': dashboard.id
        });

        dashboardSelector.append([dashboardLabel, dashboardInputVisible, dashboardInputHidden]);
      }

      dashboardSelector.insertAfter(inputField);
    }

    return form;
  }
}
