import _ from 'lodash';

import MapHelper from '../../../helpers/MapHelper';
import SoqlHelpers from '../../../dataProviders/SoqlHelpers';
import utils from 'common/js_utils';

export default class VifOverlay {
  constructor(map, sourceIds, layerIds) {
    this._map = map;
    this._sourceIds = sourceIds;
    this._layerIds = layerIds;
  }

  loadVif(vif) {
    MapHelper.afterMapLoad(this._map, () => {
      if (this._alreadySetup()) {
        this.update(vif);
      } else {
        this.setup(vif);
      }
    });
  }

  _alreadySetup() {
    return !!(this._map.style && this._map.getSource(this._sourceIds[0]));
  }

  setup(vif) {
    // To be overridden
  }

  update(newVif) {
    // To be overridden
  }

  getDataUrl() {
    // To be overridden
  }

  destroy() {
    if (!this._alreadySetup()) {
      return;
    }
    _.each(this._layerIds, (layerId) => {
      this._map.removeLayer(layerId);
    });
    _.each(this._sourceIds, (sourceId) => {
      this._map.removeSource(sourceId);
    });
  }

}
