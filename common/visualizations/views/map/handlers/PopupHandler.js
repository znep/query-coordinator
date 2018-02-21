import _ from 'lodash';

import PopupFactory from '../PopupFactory';
import { setPopupContentForLine } from '../contentFormatters/lineContentFormatter';
import { setPopupContentForPoint } from '../contentFormatters/pointContentFormatter';
import { setPopupContentForShape } from '../contentFormatters/shapeContentFormatter';
import { setPopupContentForStack } from '../contentFormatters/stackContentFormatter';

import { LAYERS as CLUSTER_LAYERS } from '../vifOverlays/partials/Clusters';
import { LAYERS as LINE_LAYERS } from '../vifOverlays/partials/Lines';
import { LAYERS as POINT_AND_STACK_LAYERS } from '../vifOverlays/partials/PointsAndStacks';
import { LAYERS as SHAPES_LAYERS } from '../vifOverlays/partials/Shapes';

export default class PopupHandler {
  constructor(map) {
    this._map = map;
    this._popup = PopupFactory.create();
    this._currentPopupFeatureGeometry = null;
  }

  // Displays tipsy for the given feature in the map.
  // Arguments:
  //    - feature   : geojson object got back from mapboxgl map for which to show the tipsy
  async showPopup(popupOptions = {}) {
    const { event, feature, renderOptions, vif } = popupOptions;
    const featureGeometry = feature.geometry;

    // To prevent recalculating and showing popup, when a poppup is already shown for the
    // given feature.
    if (_.isEqual(this._currentPopupFeatureGeometry, featureGeometry)) {
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

    if (featureId === POINT_AND_STACK_LAYERS.POINT || featureId === POINT_AND_STACK_LAYERS.STACK_CIRCLE) {
      this._popup.setLngLat(coordinates);
    } else {
      this._popup.setLngLat([event.lngLat.lng, event.lngLat.lat]);
    }

    this._popup.setDOMContent(popupContentElement);
    this._popup.addTo(this._map);

    if (featureId === POINT_AND_STACK_LAYERS.POINT) {
      return await setPopupContentForPoint(popupParams);
    } else if (featureId === POINT_AND_STACK_LAYERS.STACK_CIRCLE) {
      return setPopupContentForStack(popupParams);
    } else if (featureId === LINE_LAYERS.LINE) {
      return await setPopupContentForLine(popupParams);
    } else if (featureId === SHAPES_LAYERS.SHAPE_FILL) {
      return await setPopupContentForShape(popupParams);
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
