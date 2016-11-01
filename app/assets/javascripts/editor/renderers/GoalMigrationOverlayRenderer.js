import $ from 'jquery';

import { goalMigrationStore } from '../stores/GoalMigrationStore';

export default function GoalMigrationOverlayRenderer() {

  const $overlay = $('<div id="goal-migration-overlay">');
  const $overlayText = $('<p>').appendTo($overlay);

  goalMigrationStore.addChangeListener(render);
  render();

  function render() {
    if (goalMigrationStore.hasError()) {
      $overlayText.text(`Error migrating goal: ${goalMigrationStore.error()}`); // TODO need UX
      $(document.body).append($overlay);
    } else if (goalMigrationStore.isMigrating()) {
      $overlayText.text('MIGRATING...'); // TODO need UX
      $(document.body).append($overlay);
    } else {
      _.delay(() => $overlay.remove(), 2000);
    }
  }

}
