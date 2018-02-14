import _ from 'lodash';

import VifOverlay from './VifOverlay';
import Regions from './partials/Regions';
import Legend from './partials/Legend';

import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';

export default class VifRegionOverlay extends VifOverlay {
  constructor(map, visualizationElement) {
    super(map, Regions.sourceIds(), Regions.layerIds());

    this._regions = new Regions(map);
    this._legend = new Legend(visualizationElement);
  }

  async setup(vif) {
    const renderOptions = await this._prepare(vif);

    this._regions.setup(vif, renderOptions);
    this._legend.show(renderOptions.buckets);
  }

  async update(vif) {
    const renderOptions = await this._prepare(vif);

    this._regions.update(vif, renderOptions);
    this._legend.show(renderOptions.buckets);
  }

  async _prepare(vif) {
    const tileDataUrl = this.getDataUrl(vif);

    if (!tileDataUrl) {
      return Promise.reject('domain|datasetUid|column are yet to be filled in.');
    }

    this._preparingForVif = vif;

    try {
      const measures = await getMeasures(vif, this._pointDataset(vif));
      const buckets = vif.getRegionMapBuckets(measures);
      const defaultBucket = _.last(buckets);

      const shapeColorConfigs = _.map(measures, (measure) => {
        const matchingBucket = _.find(buckets, (bucket) => {
          return measure.value >= bucket.start && measure.value < bucket.end;
        });
        const colorForShape = _.get((matchingBucket || defaultBucket), 'color');

        return { shapeId: measure.shapeId, color: colorForShape };
      });

      if (this._preparingForVif !== vif) {
        return Promise.reject('VIF updated while preparing');
      }
      return {
        measures,
        buckets,
        shapeColorConfigs,
        dataUrl: tileDataUrl,
        shapePrimaryKey: vif.getShapeDatasetPrimaryKey()
      };

    } catch (error) {
      console.error('Error while preparing region map', error);
    }
    return;
  }

  getDataUrl(vif) {
    const domain = _.get(vif, 'series[0].dataSource.domain');
    const datasetUid = vif.getShapeDatasetUid();
    const columnName = 'the_geom';

    if (_.isUndefined(domain) || _.isUndefined(datasetUid)) {
      return null;
    }

    return `https://${domain}/resource/${datasetUid}.geojson?$query=` +
      `select simplify_preserve_topology(snap_to_grid(${columnName}, {snap_precision}),{simplify_precision})` +
      `, ${vif.getShapeDatasetPrimaryKey()} ` +
      `where {{'${columnName}' column condition}} ` +
      'limit 10000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }

  destroy() {
    this._regions.destroy();
    this._legend.destroy();
  }

  _pointDataset(vif) {
    const domain = _.get(vif, 'series[0].dataSource.domain');
    const datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
    const datasetConfig = { domain, datasetUid };

    if (_.isUndefined(this._dataset) || !_.isEqual(this._existingPointDatasetConfig, datasetConfig)) {
      this.__pointDatasetInstance = new SoqlDataProvider(datasetConfig, true);
      this._existingPointDatasetConfig = datasetConfig;
    }

    return this.__pointDatasetInstance;
  }
}

async function getMeasures(vif, pointDataset) {
  const domain = _.get(vif, 'series[0].dataSource.domain');
  const datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
  const nameColumn = vif.getMeasureForeignKey();
  const valueColumn = vif.getMeasureColumn();
  const valueFunction = vif.getMeasureAggregation();
  const nameAlias = '__shape_id__';
  const valueAlias = '__value__';
  const filters = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
  const requiredVifParams = [domain, datasetUid, nameColumn, valueColumn, valueFunction];

  if (!_.every(requiredVifParams, _.isString)) {
    return null;
  }

  let queryString = `SELECT ${nameColumn} as ${nameAlias}, ${valueFunction}(${valueColumn}) as ${valueAlias}` +
    ` GROUP BY ${nameColumn}`;

  if (!_.isEmpty(filters)) {
    queryString += ` WHERE ${filters.join(' AND ')}`;
  }
  queryString += ' LIMIT 10000';

  const measureResult = await pointDataset.rawQuery(queryString);

  const measures = _.chain(measureResult).
    map((measureResultItem) => {
      const shapeId = measureResultItem[nameAlias];
      if (_.isUndefined(shapeId)) {
        return shapeId;
      }
      return {
        shapeId,
        value: Number(measureResultItem[valueAlias]) || 0
      };
    }).
    compact().value();

  if (_.isEmpty(measures)) {
    return;
  }

  return measures;
}
