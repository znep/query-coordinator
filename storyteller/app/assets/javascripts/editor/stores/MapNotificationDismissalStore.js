import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import { assertHasProperties } from 'common/js_utils';
import { moveComponentStore } from './MoveComponentStore';

/* Responsible for:
 * Tracking whether the map notification has been dismissed. All maps will
 * have a notification on load, until dismissed.
 *
 * Registers to:
 * - DISMISS_MAP_NOTIFICATION
 * - MOVE_COMPONENT_DESTINATION_CHOSEN
 *
 * Provides:
 * - isDismissed(blockId, componentIndex)
 */
export const mapNotificationDismissalStore = new MapNotificationDismissalStore();
export default function MapNotificationDismissalStore() {
  _.extend(this, new Store());

  const self = this;
  const _mapNotificationDismissed = {};

  this.register(function(payload) {
    const action = payload.action;

    switch (action) {
      case Actions.DISMISS_MAP_NOTIFICATION:
        _.set(_mapNotificationDismissed, `${payload.blockId}_${payload.componentIndex}`, true);
        self._emitChange();
        break;
      case Actions.MOVE_COMPONENT_DESTINATION_CHOSEN:
        _moveDismissal(payload);
        break;
    }
  });

  /*
   * @param   {num}        blockId
   * @param   {num}        componentIndex
   * @return  {boolean}    true if the block needs a confirmation dialog
   */
  this.isDismissed = function(blockId, componentIndex) {
    const storePath = `${blockId}_${componentIndex}`;
    return _.isMatch(_mapNotificationDismissed, { [storePath]: true });
  };

  function _moveDismissal(payload) {
    assertHasProperties(payload, 'blockId', 'componentIndex');

    const sourceComponent = moveComponentStore.getSourceMoveComponent();
    const sourcePath = `${sourceComponent.blockId}_${sourceComponent.componentIndex}`;
    const destinationPath = `${payload.blockId}_${payload.componentIndex}`;
    const previousSourceValue = _.get(_mapNotificationDismissed, sourcePath);
    const previousDestinationValue = _.get(_mapNotificationDismissed, destinationPath);

    _.set(_mapNotificationDismissed, destinationPath, previousSourceValue);
    _.set(_mapNotificationDismissed, sourcePath, previousDestinationValue);

    self._emitChange();
  }
}
