import $ from 'jquery';
import _ from 'lodash';

import mapboxgl from 'mapbox-gl';
import MapHelper from '../../helpers/MapHelper';

import VifBaseMap from './VifBaseMap';
import VifMapControls from './VifMapControls';
import VifMapInteractionHandler from './VifMapInteractionHandler';

import GeospaceDataProvider from '../../dataProviders/GeospaceDataProvider';

export default class MapFactory {
  // Instantiates a mapboxgl map with given vif.
  // Case 1: Vif contains zoom and center
  //    Load map with the given zoom and center
  // Case 2: Vif does not contain zoom and center
  //    It fetches the feature bounds for the given datasource,
  //    instantiates the map at the center of the bounds and
  //    zooms in/out to fit the feature bounds.
  static async build(element, vif) {
    const mapElement = initializeAndGetMapElement(element);
    const mapOptions = getMapOptions(mapElement, vif);

    if (mapOptions.zoom && mapOptions.center) {
      return new mapboxgl.Map(mapOptions);
    } else {
      const featureLngLatBounds = await MapFactory.getFeatureBounds(vif);
      mapOptions.zoom = 10;
      mapOptions.center = featureLngLatBounds.getCenter().toArray();

      const map = new mapboxgl.Map(mapOptions);
      map.fitBounds(featureLngLatBounds, { animate: false });

      return map;
    }
  }

  // Fetches the feature bounds for the given vif datasource,
  // and returns it as mapboxgl.LatLngBounds.
  static async getFeatureBounds(vif) {
    const domain = _.get(vif, 'series[0].dataSource.domain');
    let datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
    let columnName = _.get(vif, 'series[0].dataSource.dimension.columnName');

    if (vif.isRegionMap()) {
      datasetUid = _.get(vif, 'configuration.shapefile.uid');
      columnName = 'the_geom';
    }

    const geospaceDataProvider = new GeospaceDataProvider({ domain, datasetUid }, true);

    try {
      const extent = await geospaceDataProvider.getFeatureExtent(columnName, true);
      return new mapboxgl.LngLatBounds(
        [extent.southwest[1], extent.southwest[0]],
        [extent.northeast[1], extent.northeast[0]]
      );
    } catch (error) {
      console.warn('getFeatureBounds error', error);
    }
  }
}

function getMapOptions(mapElement, vif) {
  let mapOptions = {
    container: mapElement,
    attributionControl: false,
    maxZoom: 18,
    transformRequest: MapHelper.substituteSoqlParams
  };

  return _.merge(mapOptions,
    VifBaseMap.getMapInitOptions(vif),
    VifMapControls.getMapInitOptions(vif),
    VifMapInteractionHandler.getMapInitOptions(vif)
  );
}

function initializeAndGetMapElement(element) {
  const vizContainer = element.find('.socrata-visualization-container');
  const mapElement = $('<div>', { 'class': 'unified-map-instance' });
  vizContainer.append(mapElement);

  return mapElement[0];
}
