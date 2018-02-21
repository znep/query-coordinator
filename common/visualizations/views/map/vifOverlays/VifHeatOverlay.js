import _ from 'lodash';

import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import utils from 'common/js_utils';
import { getBaseMapLayerStyles } from 'common/visualizations/views/map/baseMapStyle';

import HeatClusters from './partials/HeatClusters';
import VifOverlay from './VifOverlay';

const HEAT_SOURCE_ID = 'heatVectorDataSource';
const LAYERS = {
  HEAT_LAYER: 'heatLayer'
};

// Basic heat map version (No tuning option from vif)
// Clusters on server side using snap_to_grid and draws heatmap
// based on count of each record.
export default class VifHeatOverlay extends VifOverlay {
  constructor(map) {
    const sourceIds = [].concat(HeatClusters.sourceIds());
    const layerIds = [].concat(HeatClusters.layerIds());
    super(map, sourceIds, layerIds);

    this._heatClusters = new HeatClusters(map);
  }

  setup(vif) {
    const renderOptions = {
      layerStyles: getBaseMapLayerStyles(vif),
      dataUrl: this.getDataUrl(vif)
    };

    this._heatClusters.setup(vif, renderOptions);
  }

  update(vif) {
    const renderOptions = {
      layerStyles: getBaseMapLayerStyles(vif),
      dataUrl: this.getDataUrl(vif)
    };

    this._heatClusters.update(vif, renderOptions);
  }

  destroy() {
    this._heatClusters.destroy();
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
      `select count(*),snap_to_grid(${columnName},{snap_precision}) ` +
      `where ${conditions.join(' AND ')} ` +
      `group by snap_to_grid(${columnName}, {snap_precision}) ` +
      'limit 100000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }
}
