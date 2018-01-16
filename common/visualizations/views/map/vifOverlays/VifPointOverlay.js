import _ from 'lodash';

import VifOverlay from './VifOverlay';
import SoqlHelpers from '../../../dataProviders/SoqlHelpers';
import utils from 'common/js_utils';
import { getBaseMapLayerStyles } from '../baseMapStyle';
import * as selectors from '../../../../authoring_workflow/selectors/vifAuthoring';

const SOURCES = Object.freeze({
  POINTS_AND_STACKS: 'pointVectorDataSource',
  CLUSTERS: 'clustersVectorDataSource'
});

const LAYERS = Object.freeze({
  STACK_CIRCLE: 'stack-circle',
  STACK_COUNT_LABEL: 'stack-count-label',
  POINT: 'point',
  CLUSTER_CIRCLE: 'cluster-circle',
  CLUSTER_COUNT_LABEL: 'cluster-count-label'
});

export default class VifPointOverlay extends VifOverlay {
  constructor(map) {
    super(map, _.values(SOURCES), _.values(LAYERS));
  }

  setup(vif) {
    const layerStyles = getBaseMapLayerStyles(vif);
    this._setupPointsAndStacks(vif, layerStyles);
    this._setupClusters(vif, layerStyles);
    this._existingVif = vif;
  }

  update(vif) {
    if (this._sourceOptionsChanged(vif)) {
      this.destroy();
      this.setup(vif);
    } else {
      const layerStyles = getBaseMapLayerStyles(vif);

      // Updating point color/radius based on new vif
      this._map.setPaintProperty(LAYERS.POINT, 'circle-color', getPointColor(vif));
      this._map.setPaintProperty(LAYERS.POINT, 'circle-radius', getPointCircleRadius(vif));

      // Updating stack look and feel based on new base-map-style in vif
      this._map.setPaintProperty(LAYERS.STACK_CIRCLE, 'circle-radius', layerStyles.STACK_SIZE / 2);
      this._map.setPaintProperty(LAYERS.STACK_CIRCLE, 'circle-color', layerStyles.STACK_COLOR);
      this._map.setPaintProperty(LAYERS.STACK_CIRCLE, 'circle-stroke-width', layerStyles.STACK_BORDER_SIZE);
      this._map.setPaintProperty(LAYERS.STACK_CIRCLE, 'circle-stroke-color', layerStyles.STACK_BORDER_COLOR);
      this._map.setPaintProperty(LAYERS.STACK_CIRCLE, 'circle-stroke-opacity', layerStyles.STACK_BORDER_OPACITY);
      this._map.setPaintProperty(LAYERS.STACK_COUNT_LABEL, 'text-color', layerStyles.STACK_TEXT_COLOR);

      // Updating cluster look and feel based on new base-map-style in vif
      this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-radius', getClusterCircleRadiusPaintProperty(vif));
      this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-color', layerStyles.CLUSTER_COLOR);
      this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-stroke-width', layerStyles.CLUSTER_BORDER_SIZE);
      this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-stroke-color', layerStyles.CLUSTER_BORDER_COLOR);
      this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-stroke-opacity', layerStyles.CLUSTER_BORDER_OPACITY);
      this._map.setPaintProperty(LAYERS.CLUSTER_COUNT_LABEL, 'text-color', layerStyles.CLUSTER_TEXT_COLOR);
    }
    this._existingVif = vif;
  }

  getDataUrl(vif) {
    const domain = _.get(vif, 'series[0].dataSource.domain');
    const datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
    const columnName = _.get(vif, 'series[0].dataSource.dimension.columnName');

    utils.assertIsOneOfTypes(columnName, 'string');
    utils.assertIsOneOfTypes(domain, 'string');
    utils.assertIsOneOfTypes(datasetUid, 'string');

    let conditions = [`{{'${columnName}' column condition}}`];

    const filters = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
    if (!_.isEmpty(filters)) {
      conditions.push(filters);
    }

    return `https://${domain}/resource/${datasetUid}.geojson?$query=` +
      `select count(*),snap_for_zoom(${columnName},{snap_zoom}) ` +
      `where ${conditions.join(' AND ')} ` +
      `group by snap_for_zoom(${columnName}, {snap_zoom}) ` +
      'limit 100000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }

  _sourceOptionsChanged(vif) {
    return this.getDataUrl(this._existingVif) !== this.getDataUrl(this._existingVif) ||
      getMaxClusteringZoomLevel(this._existingVif) !== getMaxClusteringZoomLevel(vif) ||
      getStackRadius(this._existingVif) !== getStackRadius(vif) ||
      getClusterRadius(this._existingVif) !== getClusterRadius(vif);
  }

  _setupPointsAndStacks(vif, layerStyles) {
    this._map.addSource(SOURCES.POINTS_AND_STACKS, {
      'type': 'vector',
      'geojsonTile': true,
      'cluster': true,
      'clusterRadius': getStackRadius(vif),
      'aggregateBy': 'count',
      'tiles': [this.getDataUrl(vif)],
      'minzoom': getMaxClusteringZoomLevel(vif) + 1
    });

    this._map.addLayer({
      'id': LAYERS.STACK_CIRCLE,
      'type': 'circle',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['any', ['has', 'point_count'], ['>', 'count', '1']],
      'paint': {
        'circle-radius': layerStyles.STACK_SIZE / 2,
        'circle-color': layerStyles.STACK_COLOR,
        'circle-stroke-width': layerStyles.STACK_BORDER_SIZE,
        'circle-stroke-color': layerStyles.STACK_BORDER_COLOR,
        'circle-stroke-opacity': layerStyles.STACK_BORDER_OPACITY
      }
    });

    this._map.addLayer({
      id: LAYERS.STACK_COUNT_LABEL,
      type: 'symbol',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['any', ['has', 'point_count'], ['>', 'count', '1']],
      layout: {
        // If clustered by mapbox,
        //  it will have sum_abbrev (which is the sum of counts of every record)
        // If a single record from server,
        //  it will have count
        // In any case either sum_abbrev will be present or count will be present.
        // So the below expression will print the existing one and empty string for
        // non-existing one.
        'text-field': '{sum_abbrev}{count}',
        'text-size': 12,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': layerStyles.STACK_TEXT_COLOR
      }
    });

    this._map.addLayer({
      id: LAYERS.POINT,
      type: 'circle',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['all', ['!has', 'point_count'], ['==', 'count', '1']],
      'paint': {
        'circle-radius': getPointCircleRadius(vif),
        'circle-color': getPointColor(vif)
      }
    });
  }

  _setupClusters(vif, layerStyles) {
    this._map.addSource(SOURCES.CLUSTERS, {
      'type': 'vector',
      'geojsonTile': true,
      'cluster': true,
      'clusterRadius': getClusterRadius(vif),
      'aggregateBy': 'count',
      'tiles': [this.getDataUrl(vif)],
      'maxzoom': getMaxClusteringZoomLevel(vif)
    });

    this._map.addLayer({
      'id': LAYERS.CLUSTER_CIRCLE,
      'type': 'circle',
      'source': SOURCES.CLUSTERS,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'circle-radius': getClusterCircleRadiusPaintProperty(vif),
        'circle-color': layerStyles.CLUSTER_COLOR,
        'circle-stroke-width': layerStyles.CLUSTER_BORDER_SIZE,
        'circle-stroke-color': layerStyles.CLUSTER_BORDER_COLOR,
        'circle-stroke-opacity': layerStyles.CLUSTER_BORDER_OPACITY
      }
    });

    this._map.addLayer({
      id: LAYERS.CLUSTER_COUNT_LABEL,
      type: 'symbol',
      'source': SOURCES.CLUSTERS,
      'source-layer': '_geojsonTileLayer',
      layout: {
        // If clustered by mapbox,
        //  it will have sum_abbrev (which is the sum of counts of every record)
        // If a single record from server,
        //  it will have count
        // In any case either sum_abbrev will be present or count will be present.
        // So the below expression will print the existing one and empty string for
        // non-existing one.
        'text-field': '{sum_abbrev}{count}',
        'text-size': 12,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': layerStyles.CLUSTER_TEXT_COLOR
      }
    });
  }
}

function getClusterCircleRadiusPaintProperty(vif) {
  return {
    type: 'interval',
    property: 'sum',
    stops: [
      [0, getClusterCircleMinRadius(vif)],
      [100, (getClusterCircleMinRadius(vif) + getClusterCircleMaxRadius(vif)) / 2],
      [1000, getClusterCircleMaxRadius(vif)]
    ],
    'default': getClusterCircleMinRadius()
  };
}

function getClusterCircleMaxRadius(vif) {
  return _.get(vif, 'series[0].mapOptions.maxClusterSize', 40) / 2;
}

function getClusterCircleMinRadius() {
  return 12;
}

function getPointColor(vif) {
  return _.get(vif, 'series[0].color.primary', '#ff00ff');
}

function getPointCircleRadius(vif) {
  return _.get(vif, 'series[0].mapOptions.pointMapPointSize', 10) / 2;
}

function getMaxClusteringZoomLevel(vif) {
  return _.get(vif, 'series[0].mapOptions.maxClusteringZoomLevel', 11);
}

function getClusterRadius(vif) {
  return _.get(vif, 'series[0].mapOptions.clusterRadius', 80);
}

function getStackRadius(vif) {
  return _.get(vif, 'series[0].mapOptions.stackRadius', 20);
}
