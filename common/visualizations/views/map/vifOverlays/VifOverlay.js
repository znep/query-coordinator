import _ from 'lodash';

import MapHelper from '../../../helpers/MapHelper';
import SoqlHelpers from '../../../dataProviders/SoqlHelpers';
import utils from 'common/js_utils';

export default class VifOverlay {
  constructor(map) {
    this._map = map;
    this._alreadySetUp = false;
  }

  loadVif(vif) {
    MapHelper.afterMapLoad(this._map, () => {
      if (this._alreadySetUp) {
        this.update(vif);
      } else {
        this.setup(vif);
        this._alreadySetUp = true;
      }
    });
  }

  setup(vif) {
    // To be overridden
  }

  update(newVif) {
    // To be overridden
  }

  destroy() {
    // To be overridden
  }

  getDataUrl() {
    // To be overridden
  }

}
