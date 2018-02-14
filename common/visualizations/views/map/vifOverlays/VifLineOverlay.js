import _ from 'lodash';

import VifOverlay from './VifOverlay';
import Lines from './partials/Lines';
import Legend from './partials/Legend';
import { getBaseMapLayerStyles } from '../baseMapStyle';

import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';
import RenderByHelper from 'common/visualizations/helpers/RenderByHelper';

const OTHER_COLOR_BY_CATEGORY = '__$$other$$__';
const COLOR_BY_CATEGORY_ALIAS = '__color_by_category__';
const WEIGH_BY_ALIAS = '__weigh_by__';
const COUNT_ALIAS = '__count__';

// Prepares renderByOptions for rendering lines,
// tile url for fetching lines as geojson
// and hands it over to lines partial for rendering
// using mapbox-gl's sources/layers.
export default class VifLineOverlay extends VifOverlay {
  constructor(map, visualizationElement) {
    const sourceIds = [].concat(Lines.sourceIds());
    const layerIds = [].concat(Lines.layerIds());
    super(map, sourceIds, layerIds);

    this._legend = new Legend(visualizationElement);
    this._lines = new Lines(map);
  }

  async setup(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._lines.setup(vif, renderOptions);

    return renderOptions;
  }

  async update(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._lines.update(vif, renderOptions);

    return renderOptions;
  }

  // Makes required soql calls
  //    * getting top values for coloring by.
  //    * getting range for resizePointsBy buckets.
  // and returns the renderOptions.
  async _prepare(vif) {
    this._preparingForVif = vif;
    const colorByColumn = vif.getLineColorByColumn();
    const weighByColumn = vif.getLineWeighByColumn();

    try {
      const [colorByCategories, resizeByRange] = await Promise.all([
        RenderByHelper.getColorByCategories(vif, this._lineDataset(vif), colorByColumn),
        RenderByHelper.getResizeByRange(vif, this._lineDataset(vif), weighByColumn)
      ]);

      if (this._preparingForVif !== vif) {
        return Promise.reject('VIF updated while preparing');
      }

      return {
        colorByCategories,
        resizeByRange,
        countBy: COUNT_ALIAS,
        colorBy: COLOR_BY_CATEGORY_ALIAS,
        aggregateAndResizeBy: weighBy(vif),
        layerStyles: getBaseMapLayerStyles(vif),
        dataUrl: this.getDataUrl(vif, colorByCategories)
      };
    } catch (error) {
      throw ('Error preparing line map.', error);
    }
  }

  _lineDataset(vif) {
    const datasetConfig = {
      domain: vif.getDomain(),
      datasetUid: vif.getDatasetUid()
    };

    if (_.isUndefined(this.__lineDatasetInstance) || !_.isEqual(this._existingLineDatasetConfig, datasetConfig)) {
      this.__lineDatasetInstance = new SoqlDataProvider(datasetConfig, true);
      this._existingLineDatasetConfig = datasetConfig;
    }

    return this.__lineDatasetInstance;
  }

  destroy() {
    this._lines.destroy();
    this._legend.destroy();
  }

  getDataUrl(vif, colorByCategories) {
    const columnName = vif.getColumnName();
    const colorByColumn = vif.getLineColorByColumn();
    const weighByColumn = vif.getLineWeighByColumn();

    let conditions = [`{{'${columnName}' column condition}}`];
    const filters = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
    if (!_.isEmpty(filters)) {
      conditions.push(filters);
    }

    let selects = [`simplify_preserve_topology(snap_to_grid(${columnName},{snap_precision}),{simplify_precision})`];
    let groups = [`simplify_preserve_topology(snap_to_grid(${columnName},{snap_precision}),{simplify_precision})`];

    if (_.isString(colorByColumn) && !_.isEmpty(colorByCategories)) {
      // We are not grouping by colorByColumn. In case that column had 10K unique values,
      // then grouping by the colorByColumn and snapToGrid, will return
      // 10K * snappedToGrid location => number of results. Which will be too much.
      // Instead, we are only interesed in the top x values(colorByCategories) in the colorbyColumn.
      // So we select/group the remaining values as OTHER_COLOR_BY_CATEGORY and the top x in separate groups.

      // We are concatenating empty string to the resizeBy column to convert it to string.
      // Otherwise, depending on whether it is a numeric column or string column, we need to
      // use quotes around values(colorByCategories value) in case statement.
      const colorByCategoriesString = _.chain(colorByCategories).
        map(SoqlHelpers.soqlEncodeValue).
        map(encodeURIComponent).
        value();

      selects.push('CASE(' +
        `${colorByColumn}||'' in (${colorByCategoriesString}),` + // if Condition
        `${colorByColumn}||'',` + // if value
        'true,' + // else condition
        `'${OTHER_COLOR_BY_CATEGORY}'` + // else value
        `) as ${COLOR_BY_CATEGORY_ALIAS}`);

      groups.push(COLOR_BY_CATEGORY_ALIAS);
    }

    if (_.isString(weighByColumn)) {
      selects.push(`sum(${weighByColumn}) as ${WEIGH_BY_ALIAS}`);
      conditions.push(`${weighByColumn} is NOT NULL`);
    }
    selects.push(`count(*) as ${COUNT_ALIAS}`);

    return `https://${vif.getDomain()}/resource/${vif.getDatasetUid()}.geojson?$query=` +
      `select ${selects.join(',')} ` +
      `where ${conditions.join(' AND ')} ` +
      `group by ${groups.join(',')} ` +
      'limit 200000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }
}

function weighBy(vif) {
  const weighByColumn = vif.getLineWeighByColumn();
  if (_.isString(weighByColumn)) {
    return WEIGH_BY_ALIAS;
  }
  return COUNT_ALIAS;
}
