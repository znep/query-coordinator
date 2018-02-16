import _ from 'lodash';

import SvgVisualization from './SvgVisualization';
import { MAP_TYPES, POINT_AGGREGATIONS } from './mapConstants';

import MapFactory from './map/MapFactory';
import MouseInteractionHandler from './map/handlers/MouseInteractionHandler';
import PopupHandler from './map/handlers/PopupHandler';
import VifBaseMap from './map/VifBaseMap';
import VifMapControls from './map/VifMapControls';
import VifMapInteractionHandler from './map/VifMapInteractionHandler';
import * as vifDecorator from './map/vifDecorators/vifDecorator';

import VifPointOverlay from './map/vifOverlays/VifPointOverlay';
import VifLineOverlay from './map/vifOverlays/VifLineOverlay';
import VifShapeOverlay from './map/vifOverlays/VifShapeOverlay';
import VifRegionOverlay from './map/vifOverlays/VifRegionOverlay';
import VifHeatOverlay from './map/vifOverlays/VifHeatOverlay';

export default class UnifiedMap extends SvgVisualization {
  constructor(visualizationElement, vif, options) {
    super(visualizationElement, vif, options);
    this._element = visualizationElement;

    vif = vifDecorator.getDecoratedVif(vif);
    MapFactory.build(visualizationElement, vif).then((map) => {
      this._map = map;
      this._vifBaseMap = new VifBaseMap(this._map);
      this._vifBaseMap.initialize(vif);

      this._vifMapControls = new VifMapControls(this._map);
      this._vifMapControls.initialize(vif);

      this._vifMapInteractionHandler = new VifMapInteractionHandler(this._map);
      this._vifMapInteractionHandler.initialize(vif);

      this._popupHandler = new PopupHandler(map);
      this._mouseInteractionHandler = new MouseInteractionHandler(map, this._popupHandler);

      this._currentOverlay = this._getOverlay(vif);
      this._currentOverlay.loadVif(vif);
      // Adding Map object to visualization DOM element,
      // to get mapbox gl map for manual and automated testing
      visualizationElement[0].map = map;

      this._map.on('zoomend', () => {
        this._emitMapCenterAndZoomChange();
      });

      this._map.on('dragend', () => {
        this._emitMapCenterAndZoomChange();
      });

      this._map.on('pitchend', () => {
        this._emitMapPitchAndBearingChange();
      });

      this._map.on('rotateend', () => {
        this._emitMapPitchAndBearingChange();
      });
    });

    this.invalidateSize = () => {
      if (this._map) {
        this._map.resize();
      }
    };

    this.onUpdateEvent = (event) => {
      const newVif = _.get(event, 'originalEvent.detail');
      this.update(newVif);
    };
    this._existingVif = vif;
  }

  destroy() {
    if (this._map) {
      this._map.remove();
    }
  }

  async update(newVif) {
    newVif = vifDecorator.getDecoratedVif(newVif);
    const newOverlay = this._getOverlay(newVif);

    this._vifBaseMap.update(newVif);
    this._vifMapControls.update(newVif);
    this._vifMapInteractionHandler.update(newVif);
    this.updateVif(newVif);

    if (this._currentOverlay !== newOverlay) {
      this._currentOverlay.destroy();
    }

    if (this._currentOverlay.getDataUrl(newVif) !== newOverlay.getDataUrl(newVif)) {
      const featureLngLatBounds = await MapFactory.getFeatureBounds(newVif);
      if (featureLngLatBounds !== null) {
        this._map.fitBounds(featureLngLatBounds, { animate: true });
      }
    }

    newOverlay.loadVif(newVif);

    this._currentOverlay = newOverlay;
    this._existingVif = newVif;

    return true;
  }

  _getOverlay(vif) {
    const newMapType = _.get(vif, 'series[0].mapOptions.mapType');
    const newPointAggregation = _.get(vif, 'series[0].mapOptions.pointAggregation');
    const existingMapType = _.get(this._existingVif, 'series[0].mapOptions.mapType');
    const existingPointAggregation = _.get(this._existingVif, 'series[0].mapOptions.pointAggregation');

    if (existingMapType === newMapType &&
        existingPointAggregation === newPointAggregation &&
        this._existingVif.isRegionMap() === vif.isRegionMap() &&
        this._currentOverlay) {
      return this._currentOverlay;
    }

    if (newMapType == MAP_TYPES.POINT_MAP) {
      if (newPointAggregation == POINT_AGGREGATIONS.HEAT_MAP) {
        return new VifHeatOverlay(this._map);
      } else if (vif.isRegionMap()) {
        return new VifRegionOverlay(this._map, this._element);
      } else {
        return new VifPointOverlay(this._map, this._element, this._mouseInteractionHandler);
      }
    } else if (newMapType === MAP_TYPES.LINE_MAP) {
      return new VifLineOverlay(this._map, this._element, this._mouseInteractionHandler);
    } else if (newMapType === MAP_TYPES.BOUNDARY_MAP) {
      return new VifShapeOverlay(this._map, this._element);
    } else {
      throw new Error(`Unknown map type ${newMapType}`);
    }
  }

  _emitMapCenterAndZoomChange() {
    const center = this._map.getCenter();
    const zoom = this._map.getZoom();
    const centerAndZoom = {
      center: {
        lat: center.lat,
        lng: center.lng
      },
      zoom: zoom
    };
    this.emitEvent('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', centerAndZoom);
  }

  _emitMapPitchAndBearingChange() {
    const bearing = this._map.getBearing();
    const pitch = this._map.getPitch();
    const pitchAndBearing = {
      pitch: pitch,
      bearing: bearing
    };
    this.emitEvent('SOCRATA_VISUALIZATION_PITCH_AND_BEARING_CHANGED', pitchAndBearing);
  }
}
