import _ from 'lodash';

import VifOverlay from './VifOverlay';
import SoqlHelpers from '../../../dataProviders/SoqlHelpers';
import utils from 'common/js_utils';

const LINE_SOURCE_ID = 'lineVectorDataSource';
const LAYERS = {
  LINE: 'lineLayer'
};

export default class VifLineOverlay extends VifOverlay {
  constructor(map) {
    super(map, [LINE_SOURCE_ID], _.values(LAYERS));
  }

  setup(vif) {
    this._map.addSource(LINE_SOURCE_ID, {
      'type': 'vector',
      'geojsonTile': true,
      'tiles': [this.getDataUrl(vif)]
    });

    this._map.addLayer({
      'id': LAYERS.LINE,
      'type': 'line',
      'source': LINE_SOURCE_ID,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'line-color': getLineColor(vif),
        'line-width': 5
      }
    });
  }

  update(vif) {
    this._map.setPaintProperty(LAYERS.LINE, 'line-color', getLineColor(vif));
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
      `select simplify_preserve_topology(snap_to_grid(${columnName},{snap_precision}),{simplify_precision}) ` +
      `where ${conditions.join(' AND ')} ` +
      `group by simplify_preserve_topology(snap_to_grid(${columnName},{snap_precision}),{simplify_precision}) ` +
      'limit 200000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }
}

function getLineColor(vif) {
  return _.get(vif, 'series[0].color.primary');
}
