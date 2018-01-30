import _ from 'lodash';

import PopupFactory from '../PopupFactory';
import { setPopupContentForStack } from '../contentFormatters/stackContentFormatter';
import { setPopupContentForPoint } from '../contentFormatters/pointContentFormatter';
import { LAYERS as CLUSTER_LAYERS } from '../vifOverlays/partials/Clusters';
import {
  LAYERS as POINT_AND_STACK_LAYERS,
  SOURCES as POINT_AND_STACK_SOURCES
} from '../vifOverlays/partials/PointsAndStacks';

export default class PopupHandler {
  constructor(map) {
    this._map = map;
    this._popup = PopupFactory.create();
    this._currentPopupFeatureGeometry = null;
  }

  // Displays tipsy for the given feature in the map.
  // Arguments:
  //    - feature   : geojson object got back from mapboxgl map for which to show the tipsy
  async showPopup(feature, vif, renderOptions) {
    const featureGeometry = feature.geometry;

    // To prevent recalculating and showing popup, when a poppup is already shown for the
    // given feature.
    if (_.isEqual(this._currentPopupFeatureGeometry, feature.geometry)) {
      return;
    }

    const coordinates = _.get(feature, 'geometry.coordinates');
    const featureId = _.get(feature, 'layer.id');
    const popupContentElement = document.createElement('div');
    const popupParams = {
      element: popupContentElement,
      vif: vif,
      renderOptions: renderOptions,
      feature: feature,
      featureRenderedOnZoom: Math.floor(this._map.getZoom())
    };

    this._currentPopupFeatureGeometry = featureGeometry;
    this._popup.setLngLat(coordinates);
    this._popup.setDOMContent(popupContentElement);
    this._popup.addTo(this._map);

    if (featureId === POINT_AND_STACK_LAYERS.POINT) {
      return await setPopupContentForPoint(popupParams);
    } else if (featureId === POINT_AND_STACK_LAYERS.STACK_CIRCLE) {
      return setPopupContentForStack(popupParams);
    } else {
      throw new Error(`Unkown layer hover on ${featureId}`);
    }
  }

  // Removes the popup from the map it has been added to.
  removePopup() {
    this._currentPopupFeatureGeometry = null;
    this._popup.remove();
  }
}
