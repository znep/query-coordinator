import _ from 'lodash';

import VifOverlay from './VifOverlay';
import SoqlHelpers from '../../../dataProviders/SoqlHelpers';
import utils from 'common/js_utils';

const POINTS_SOURCE_ID = 'pointVectorDataSource';
const LAYERS = {
  CLUSTER_CIRCLE: 'cluster-circle',
  CLUSTER_COUNT_LABEL: 'cluster-count-label',
  CLUSTER_SINGLE_LABEL: 'cluster-single-label'
};

export default class VifPointOverlay extends VifOverlay {
  constructor(map) {
    super(map, [POINTS_SOURCE_ID], _.values(LAYERS));
  }

  setup(vif) {
    this._map.addSource(POINTS_SOURCE_ID, {
      'type': 'vector',
      'geojsonTile': true,
      'cluster': true,
      'clusterRadius': 80,
      'aggregateBy': 'count',
      'tiles': [this.getDataUrl(vif)]
    });

    this._map.addLayer({
      'id': LAYERS.CLUSTER_CIRCLE,
      'type': 'circle',
      'source': POINTS_SOURCE_ID,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'circle-radius': {
          type: 'interval',
          property: 'sum',
          stops: [
              [0, 14],
              [10, 17],
              [150, 22],
              [100000, 28]
          ]
        },
        'circle-color': getClusterCircleColor(vif)
      }
    });
    this._map.addLayer({
      id: LAYERS.CLUSTER_COUNT_LABEL,
      type: 'symbol',
      'source': POINTS_SOURCE_ID,
      'source-layer': '_geojsonTileLayer',
      'filter': ['all', ['has', 'point_count']],
      layout: {
        'text-field': '{sum_abbrev}',
        'text-size': 12
      }
    });

    this._map.addLayer({
      id: LAYERS.CLUSTER_SINGLE_LABEL,
      type: 'symbol',
      'source': POINTS_SOURCE_ID,
      'source-layer': '_geojsonTileLayer',
      'filter': ['all', ['!has', 'point_count']],
      layout: {
        'text-field': '{count}',
        'text-size': 12
      }
    });
  }

  update(vif) {
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE, 'circle-color', getClusterCircleColor(vif));
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
}

function getClusterCircleColor(vif) {
  return _.get(vif, 'series[0].color.primary');
}
