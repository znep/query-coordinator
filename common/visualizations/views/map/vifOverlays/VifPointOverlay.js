import _ from 'lodash';

import VifOverlay from './VifOverlay';
import Legend from './partials/Legend';
import { getBaseMapLayerStyles } from '../baseMapStyle';

import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';
import PointsAndStacks from './partials/PointsAndStacks';
import Clusters from './partials/Clusters';
import { COLOR_BY_BUCKETS_COUNT } from 'common/visualizations/views/mapConstants';
import RenderByHelper from 'common/visualizations/helpers/RenderByHelper';

const OTHER_COLOR_BY_CATEGORY = '__$$other$$__';
const COLOR_BY_CATEGORY_ALIAS = '__color_by_category__';
const RESIZE_BY_ALIAS = '__resize_by__';
const COUNT_ALIAS = '__count__';

export default class VifPointOverlay extends VifOverlay {
  constructor(map, visualizationElement) {
    const sourceIds = [].concat(PointsAndStacks.sourceIds()).concat(Clusters.sourceIds());
    const layerIds = [].concat(PointsAndStacks.layerIds()).concat(Clusters.layerIds());
    super(map, sourceIds, layerIds);

    this._pointsAndStacks = new PointsAndStacks(map);
    this._clusters = new Clusters(map);
    this._legend = new Legend(visualizationElement);
  }

  async setup(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._pointsAndStacks.setup(vif, renderOptions);
    this._clusters.setup(vif, renderOptions);

    return renderOptions;
  }

  async update(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._pointsAndStacks.update(vif, renderOptions);
    this._clusters.update(vif, renderOptions);

    return renderOptions;
  }

  // Makes required soql calls
  //    * getting top values for coloring by.
  //    * getting range for resizePointsBy buckets.
  // and returns the renerOptions.
  async _prepare(vif) {
    this._preparingForVif = vif;
    const colorByColumn = vif.getPointColorByColumn();
    const resizeByColumn = vif.getPointResizeByColumn();

    try {
      let colorByCategories;
      let resizeByRange;

      [colorByCategories, resizeByRange] = await Promise.all([
        RenderByHelper.getColorByCategories(vif, this._pointDataset(vif), colorByColumn),
        RenderByHelper.getResizeByRange(vif, this._pointDataset(vif), resizeByColumn)
      ]);

      if (this._preparingForVif !== vif) {
        return Promise.reject('VIF updated while preparing');
      }

      return {
        colorByCategories,
        resizeByRange,
        countBy: COUNT_ALIAS,
        colorBy: COLOR_BY_CATEGORY_ALIAS,
        aggregateAndResizeBy: resizeBy(vif),
        layerStyles: getBaseMapLayerStyles(vif),
        dataUrl: this.getDataUrl(vif, colorByCategories)
      };
    } catch (error) {
      throw ('Error preparing point map.', error);
    }
  }

  _pointDataset(vif) {
    const datasetConfig = {
      domain: vif.getDomain(),
      datasetUid: vif.getDatasetUid()
    };

    if (_.isUndefined(this._dataset) || !_.isEqual(this._existingPointDatasetConfig, datasetConfig)) {
      this.__pointDatasetInstance = new SoqlDataProvider(datasetConfig, true);
      this._existingPointDatasetConfig = datasetConfig;
    }

    return this.__pointDatasetInstance;
  }

  destroy() {
    super.destroy();
    this._legend.destroy();
  }

  getDataUrl(vif, colorByCategories) {
    const columnName = vif.getColumnName();
    const colorByColumn = vif.getPointColorByColumn();
    const resizeByColumn = vif.getPointResizeByColumn();

    let conditions = [`{{'${columnName}' column condition}}`];
    const filters = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
    if (!_.isEmpty(filters)) {
      conditions.push(filters);
    }

    let selects = [`snap_for_zoom(${columnName},{snap_zoom})`];
    let groups = [`snap_for_zoom(${columnName},{snap_zoom})`];

    if (_.isString(colorByColumn) && !_.isEmpty(colorByCategories)) {
      // We are not grouping by colorByColumn. In case that column had 10K unique values,
      // then grouping by the colorByColumn and snapToGrid, will return
      // 10K * snappedToGrid location => number of results. Which will be too much.
      // Instead, we are only interesed in the top x values(colorByCategories) in the colorbyColumn.
      // So we select/group the remaining values as OTHER_COLOR_BY_CATEGORY and the top x in separate groups.

      // We are concatenating empty string to the resizeBy column to convert it to string.
      // Otherwise, depending on whether it is a numeric column or string column, we need to
      // use quotes around values(colorByCategories value) in case statement.
      const colorByCategoriesString = _.map(colorByCategories, SoqlHelpers.soqlEncodeValue);
      selects.push('CASE(' +
        `${colorByColumn} in (${colorByCategoriesString}),` + // if Condition
        `${colorByColumn}||'',` + // if value
        'true,' + // else condition
        `'${OTHER_COLOR_BY_CATEGORY}'` + // else value
        `) as ${COLOR_BY_CATEGORY_ALIAS}`);

      groups.push(COLOR_BY_CATEGORY_ALIAS);
    }

    if (_.isString(resizeByColumn)) {
      selects.push(`sum(${resizeByColumn}) as ${RESIZE_BY_ALIAS}`);
      conditions.push(`${resizeByColumn} is NOT NULL`);
    }
    selects.push(`count(*) as ${COUNT_ALIAS}`);

    return `https://${vif.getDomain()}/resource/${vif.getDatasetUid()}.geojson?$query=` +
      `select ${selects.join(',')} ` +
      `where ${conditions.join(' AND ')} ` +
      `group by ${groups.join(',')} ` +
      'limit 50000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }
}

function resizeBy(vif) {
  const resizeByColumn = vif.getPointResizeByColumn();
  if (_.isString(resizeByColumn)) {
    return RESIZE_BY_ALIAS;
  }
  return COUNT_ALIAS;
}
