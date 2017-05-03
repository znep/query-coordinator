import $ from 'jquery';
import _ from 'lodash';

import Actions from './Actions';
import I18n from './I18n';
import StorytellerUtils from '../StorytellerUtils';
import { dispatcher } from './Dispatcher';
import { mapNotificationDismissalStore } from './stores/MapNotificationDismissalStore';

/**
 * Persists the center and zoom of the current component, if a map,
 * will append a pan and zoom notification.
 *
 * On user pan and zoom within a map, the VIF's `mapCenterAndZoom` will be
 * set via Actions.BLOCK_UPDATE_COMPONENT.
 *
 * On notification dismissal, the notification will not be shown during
 * current page load.
 *
 * The block ID and component index are determined by looking for
 * `data-block-id` and `data-component-index` attributes walking up
 * the DOM tree.
 *
 * @param {object} componentData - Component data. Required. Keys:
 *   value: {object} - component value
 *   type: {String} - component type
 */
$.fn.componentWithMapBounds = componentWithMapBounds;

export default function componentWithMapBounds(componentData) {
  const $this = $(this);
  const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex($this);
  let $notification = $this.find('.notification-container');

  // Remove the previous event handler for pan and zoom changes
  if ($notification.length > 0) {
    $this.off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED');
  }

  // Attach a new event handler for pan and zoom changes, so we can use the updated componentData.
  // If we don't reattach this handler on every call, componentData inside of the handler will be
  // whatever componentData was the first time this plugin was invoked.
  $this.on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', function(event) {
    const newCenterAndZoom = event.originalEvent.detail;
    const newValue = _.cloneDeep(componentData.value);
    _.set(newValue.vif, 'configuration.mapCenterAndZoom', newCenterAndZoom);

    if (!_.isEqual(componentData.value.vif, newValue.vif)) {
      // the feature map emits SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED when you swap it
      // with another feature map, whereas region maps do not (why this happens is mysterious;
      // they both emit the event in response to the same Leaflet events). Our dispatcher can't
      // handle being asked to do multiple things at once. If you swap the locations of two components,
      // this event gets emitted close enough that our dispatcher falls over. If we're swapping
      // component locations, we shouldn't need to be actually saving the "new" zoom, so instead
      // we drop the dispatch on the floor if the dispatcher is busy with other things in its life.
      if (!dispatcher.isDispatching()) {
        dispatcher.dispatch({
          action: Actions.BLOCK_UPDATE_COMPONENT,
          blockId: blockId,
          componentIndex: componentIndex,
          type: componentData.type,
          value: newValue
        });
      }
    }
  });

  // add the notification if it doesn't exist and the notification hasn't been dismissed yet
  if ($notification.length === 0 && !mapNotificationDismissalStore.isDismissed(blockId, componentIndex)) {
    $notification = $(`
      <div class="notification-container">
        <div class="alert info notification-message">
          <small class="notification-text">
            ${I18n.t('editor.visualizations.map_center_and_zoom_notification')}
          </small>
          <button class="btn btn-transparent notification-dismiss">
            <span class="socrata-icon-close-2"></span>
          </button>
        </div>
      </div>
    `);
    $this.append($notification);

    $notification.find('button').click(function() {
      dispatcher.dispatch({
        action: Actions.DISMISS_MAP_NOTIFICATION,
        blockId: blockId,
        componentIndex: componentIndex
      });
    });

    mapNotificationDismissalStore.addChangeListener(function() {
      if (mapNotificationDismissalStore.isDismissed(blockId, componentIndex)) {
        $notification.remove();
      }
    });
  }

  return $this;
}
