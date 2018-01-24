import _ from 'lodash';

import VifOverlay from './VifOverlay';
import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import { getBaseMapLayerStyles } from '../baseMapStyle';

import utils from 'common/js_utils';

const HEAT_SOURCE_ID = 'heatVectorDataSource';
const LAYERS = {
  HEAT_LAYER: 'heatLayer'
};

// Basic heat map version (No tuning option from vif)
// Clusters on server side using snap_to_grid and draws heatmap
// based on count of each record.
export default class VifHeatOverlay extends VifOverlay {
  constructor(map) {
    super(map, [HEAT_SOURCE_ID], _.values(LAYERS));
  }

  setup(vif) {
    const baseMapLayerStyle = getBaseMapLayerStyles(vif);
    this._map.addSource(HEAT_SOURCE_ID, this._sourceOptions(vif));

    this._map.addLayer({
      'id': LAYERS.HEAT_LAYER,
      'type': 'heatmap',
      'source': HEAT_SOURCE_ID,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        // Increase the heatmap weight based on number of points
        'heatmap-weight': {
          'property': 'count',
          'type': 'exponential',
          'stops': [
            [0, 0.2],
            [10, 0.5],
            [150, 1]
          ]
        },
        // Increase the heatmap color intensity by zoom level
        // (heatmap-intensity is a multiplier on top of heatmap-weight)
        'heatmap-intensity': {
          'stops': [
            [0, 0.5],
            [9, 1]
          ]
        },
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': {
          'stops': [
            [0, 20],
            [9, 15]
          ]
        }
      }
    }, baseMapLayerStyle.INSERT_FILL_LAYERS_BEFORE);
    this._existingVif = vif;
  }

  update(vif) {
    // On source options change, resetup the overlay.
    const existingSourceOptions = this._sourceOptions(this._existingVif);
    const newSourceOptions = this._sourceOptions(vif);

    if (!_.isEqual(existingSourceOptions, newSourceOptions)) {
      this.destroy();
      this.setup(vif);
      return;
    }

    // The prepend-before for heatLayer will change only on baseMap style change.
    // On basemap style change, we resetup the overlay already. So we dont have to
    // take care of 'prepend-before-layer' change.
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
      `select count(*),snap_to_grid(${columnName},{snap_precision}) ` +
      `where ${conditions.join(' AND ')} ` +
      `group by snap_to_grid(${columnName}, {snap_precision}) ` +
      'limit 100000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }

  _sourceOptions(vif) {
    return {
      'type': 'vector',
      'geojsonTile': true,
      'tiles': [this.getDataUrl(vif)]
    };
  }
}

function getClusterCircleColor(vif) {
  return _.get(vif, 'series[0].color.primary');
}
