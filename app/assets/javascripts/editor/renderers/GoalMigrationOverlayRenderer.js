import $ from 'jquery';

import I18n from '../I18n';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { goalMigrationStore } from '../stores/GoalMigrationStore';

function t(key) {
  return I18n.t(`editor.op_migration.${key}`);
}

export default function GoalMigrationOverlayRenderer() {

  const $overlay = $(`
    <div id="goal-migration-overlay">
      <p class="h1">${t('in_progress')}</p>
      <span class="spinner-default spinner-large"></span>
    </div>
  `);

  // const $modal = $('<div id="goal-migration-welcome">');

  goalMigrationStore.addChangeListener(render);
  render();

  function render() {
    const $body = $(document.body);
    const $documentElement = $(document.documentElement);

    if (goalMigrationStore.hasError()) {

      $body.append($overlay);
      $overlay.find('p').text(t('error'));
      $overlay.find('span').remove();

      const error = goalMigrationStore.error();
      exceptionNotifier.notify(new Error(`Failed to migrate ${window.location}: ${error.message}`));

    } else if (goalMigrationStore.isMigrating()) {

      $body.append($overlay);
      $documentElement.css('overflow-y', 'hidden');

    } else {

      _.delay(() => {

        $documentElement.css('overflow-y', '');
        $overlay.remove();

        // j/k, we're going to do this in a separate changeset

        // $body.append($modal);
        // $modal.modal({
        //   title: t('welcome_title'),
        //   content: `
        //     <p>${t('welcome_content')}</p>
        //   `
        // }).trigger('modal-open');

        // // TODO: buttons
        // $body.one('modal-dismissed', () => $modal.trigger('modal-close'));

      }, 2000);

    }
  }

}
