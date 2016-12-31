import $ from 'jquery';

import I18n from '../I18n';
import LocalStorageJSON from '../../LocalStorageJSON';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { goalMigrationStore } from '../stores/GoalMigrationStore';

function t(key) {
  return I18n.t(`editor.op_migration.${key}`);
}

const fteTracker = new LocalStorageJSON('Socrata FTE acknowledgements');
const fteKey = 'Phase 1 of Odysseus to Storyteller migration';

export default function GoalMigrationOverlayRenderer() {
  const $overlay = $(`
    <div id="goal-migration-overlay">
      <p class="h1">${t('in_progress')}</p>
      <span class="spinner-default spinner-large"></span>
    </div>
  `);

  const $modal = $('<div id="goal-migration-welcome">');
  const $modalContent = $(modalTemplate());

  goalMigrationStore.addChangeListener(render);

  function render() {
    const $body = $(document.body);
    const $documentElement = $(document.documentElement);

    if (goalMigrationStore.hasError()) {
      // Sound the alarms if the migration encountered an error.

      $overlay.find('p').text(t('error'));
      $overlay.find('span').remove();
      $body.append($overlay);

      const error = goalMigrationStore.error();
      exceptionNotifier.notify(new Error(`Failed to migrate ${window.location}: ${error.message}`));

    } else if (goalMigrationStore.isMigrating()) {
      // Show the spinner while the migration is in progress.

      $documentElement.css('overflow-y', 'hidden');
      $body.append($overlay);

    } else {
      // Hide the spinner once the migration is finished.

      $documentElement.css('overflow-y', '');
      $overlay.remove();

      // Show the FTE modal unless the user has explicitly dismissed it forever.
      if (fteTracker.get(fteKey)) {
        return;
      }

      $body.append($modal);
      $modal.modal({
        title: t('welcome_title'),
        content: $modalContent
      }).trigger('modal-open');

      $body.one('modal-dismissed', () => $modal.trigger('modal-close'));
      $modalContent.find('.btn').one('click', () => $modal.trigger('modal-close'));
      $modalContent.find('.btn-default').one('click', () => fteTracker.set(fteKey, true));

    }
  }

  function modalTemplate() {
    return `
      ${t('welcome_content')}

      <div class="modal-button-group r-to-l">
        <button class="btn btn-default">${t('welcome_close_forever')}</button>
        <button class="btn btn-primary">${t('welcome_close')}</button>
      </div>
    `;
  }
}
