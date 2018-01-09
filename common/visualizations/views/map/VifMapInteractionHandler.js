import _ from 'lodash';

/**
* Handles vif behavior init/updates.
*    - map pan/zoom => enable/disable.
* Returns mapOptions with the above mentioned for mapCreation.
*/
export default class VifMapInteractionHandler {
  constructor(map) {
    this._map = map;
  }

  initialize(vif) {
    this._updateMapPanAndZoomOptions(vif);
  }

  update(vif) {
    this._updateMapPanAndZoomOptions(vif);
  }

  static getMapInitOptions(vif) {
    return {
      scrollZoom: shouldShowPanAndZoom(vif),
      doubleClickZoom: shouldShowPanAndZoom(vif),
      boxZoom: shouldShowPanAndZoom(vif),
      touchZoomRotate: shouldShowPanAndZoom(vif)
    };
  }

  _updateMapPanAndZoomOptions(vif) {
    if (shouldShowPanAndZoom(vif)) {
      this._map.scrollZoom.enable();
      this._map.boxZoom.enable();
      this._map.doubleClickZoom.enable();
      this._map.touchZoomRotate.enable();
    } else {
      this._map.scrollZoom.disable();
      this._map.boxZoom.disable();
      this._map.doubleClickZoom.disable();
      this._map.touchZoomRotate.disable();
    }
  }
}

function shouldShowPanAndZoom(vif) {
  return _.get(vif, 'configuration.panAndZoom', true);
}
