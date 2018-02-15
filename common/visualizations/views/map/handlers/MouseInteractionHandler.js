import _ from 'lodash';

import { LAYERS as CLUSTER_LAYERS } from '../vifOverlays/partials/Clusters';
import {
  LAYERS as POINT_AND_STACK_LAYERS,
  SOURCES as POINT_AND_STACK_SOURCES
} from '../vifOverlays/partials/PointsAndStacks';

const MOUSE_CLICKABLE_LAYER_IDS = [CLUSTER_LAYERS.CLUSTER_CIRCLE];
const CUSTOM_FLYOUT_LAYERS = [POINT_AND_STACK_LAYERS.STACK_CIRCLE];
const GENERIC_FLYOUT_LAYERS = [POINT_AND_STACK_LAYERS.POINT];
const FLYOUT_LAYERS = CUSTOM_FLYOUT_LAYERS.concat(GENERIC_FLYOUT_LAYERS);

// Handles mouse events (mousemove, click) for points/stacks/clusters displayed
// by VifPointOverlay.
// Sample Feature: (Geojson object got from mapbox-gl map)
//    {
//      "type": "Feature",
//      "geometry": {
//        "type": "Point",
//        "coordinates": [-122.44754076004028,37.8044394394888]
//      },
//      "properties": {
//        "cluster": true
//        "cluster_id": 13
//        "count": 15489
//        "count_abbrev": "15k"
//        "count_group": "{\"Abandoned Vehicle\":2645,\"__$$other$$__\":6946,\"Street and Sidewalk Cleaning\":3109,\"Graffiti Private Property\":1027,\"Graffiti Public Property\":1424,\"SFHA Requests\":338}"
//        "point_count": 162
//        "point_count_abbreviated": 162
//        "__aggregate_by__": 97491
//        "__aggregate_by___abbrev": "97k"
//        "__aggregate_by___group": "{\"Abandoned Vehicle\":17386,\"__$$other$$__\":44145,\"Street and Sidewalk Cleaning\":18816,\"Graffiti Private Property\":6191,\"Graffiti Public Property\":8587,\"SFHA Requests\":2366}"
//      },
//      "layer": {
//        "id":"stack-circle",
//        "type":"circle",
//        "source":"pointVectorDataSource",
//        "source-layer":"_geojsonTileLayer",
//        "filter":["any",["has","point_count"], ...],
//        "paint":{"circle-radius":12, ...}
//      }
//    }
export default class MouseInteractionHandler {
  constructor(map, popupHandler) {
    this._map = map;
    this._popupHandler = popupHandler;
    this._renderOptions = {};
    this._vif = {};

    // No need to unbind the event listeners on destroy. It is automatically taken care of
    // in unifiedMap using map.remove();(https://www.mapbox.com/mapbox-gl-js/api/#map#remove).
    this._map.on('mousemove', this._onMouseMove);
    this._map.on('click', this._onMouseClick);
  }

  setupOrUpdate(vif, renderOptions) {
    this._vif = vif;
    this._renderOptions = renderOptions;
  }

  _getFeaturesAt(point, layers) {
    const availableLayers = _.filter(layers, (layer) => this._map.getLayer(layer));

    return this._map.queryRenderedFeatures(point, { layers: availableLayers });
  }

  // Event handler, gets called when mouse is clicked in the mapboxgl map element.
  _onMouseClick = (event) => {
    const clickedOnFeatures = this._getFeaturesAt(event.point, MOUSE_CLICKABLE_LAYER_IDS);

    if (_.isEmpty(clickedOnFeatures)) {
      return;
    }

    this._map.easeTo({ center: event.lngLat, zoom: this._map.getZoom() + 2 });
  }

  // Event handler, gets called when mouse is moved in the mapboxgl map element.
  // If multiple points/stacks/clusters are displayed on the same location and
  // mouse is hovered over the common area, then on querying features at the mouse
  // location will have all those features. In that case, we take the first feature
  // and show tipsy for it.
  _onMouseMove = (event) => {
    let mouseInteractableLayerIds = MOUSE_CLICKABLE_LAYER_IDS.concat(CUSTOM_FLYOUT_LAYERS);

    if (!_.isEmpty(this._vif.getAllFlyoutColumns())) {
      mouseInteractableLayerIds = mouseInteractableLayerIds.concat(GENERIC_FLYOUT_LAYERS);
    }

    const hoveredOverFeatures = this._getFeaturesAt(event.point, mouseInteractableLayerIds);
    if (_.isEmpty(hoveredOverFeatures)) {
      this._map.getCanvas().style.cursor = '';
      this._popupHandler.removePopup();
      return;
    }

    const hoveredOverFeature = hoveredOverFeatures[0];
    const hoveredOverFeatureId = _.get(hoveredOverFeature, 'layer.id');
    const hoverOnClickableFeature = _.includes(MOUSE_CLICKABLE_LAYER_IDS, hoveredOverFeatureId);

    this._map.getCanvas().style.cursor = hoverOnClickableFeature ? 'pointer' : 'auto';

    if (_.includes(FLYOUT_LAYERS, hoveredOverFeatureId)) {
      this._popupHandler.showPopup(hoveredOverFeature, this._vif, this._renderOptions);
    } else {
      this._popupHandler.removePopup();
    }
  }
}
