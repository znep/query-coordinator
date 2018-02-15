import _ from 'lodash';

import Legend from './partials/Legend';
import Shapes from './partials/Shapes';
import VifOverlay from './VifOverlay';
import { getBaseMapLayerStyles } from '../baseMapStyle';

import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import RenderByHelper from 'common/visualizations/helpers/RenderByHelper';

const OTHER_COLOR_BY_CATEGORY = '__$$other$$__';
const COLOR_BY_CATEGORY_ALIAS = '__color_by_category__';

// Prepares renderByOptions for rendering shapes,tile url for fetching shapes as geojson
// and hands it over to shapes partial for rendering using mapbox-gl's sources/layers

export default class VifShapeOverlay extends VifOverlay {
  constructor(map, visualizationElement) {
    const sourceIds = [].concat(Shapes.sourceIds());
    const layerIds = [].concat(Shapes.layerIds());
    super(map, sourceIds, layerIds);

    this._legend = new Legend(visualizationElement);
    this._shapes = new Shapes(map);
  }

  async setup(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._shapes.setup(vif, renderOptions);

    return renderOptions;
  }

  async update(vif) {
    const renderOptions = await this._prepare(vif);

    this._legend.show(
      vif.getColorByBuckets(renderOptions.colorByCategories),
      'categorical'
    );
    this._shapes.update(vif, renderOptions);

    return renderOptions;
  }

  // Makes required soql calls
  //    * getting top values for coloring by.
  // and returns the renderOptions.
  async _prepare(vif) {
    this._preparingForVif = vif;
    const colorByColumn = vif.getShapeColorByColumn();

    try {
      const colorByCategories = await RenderByHelper.getColorByCategories(
        vif,
        colorByColumn
        );

      if (this._preparingForVif !== vif) {
        return Promise.reject('VIF updated while preparing');
      }

      return {
        colorByCategories,
        colorBy: COLOR_BY_CATEGORY_ALIAS,
        layerStyles: getBaseMapLayerStyles(vif),
        dataUrl: this.getDataUrl(vif, colorByCategories)
      };
    } catch (error) {
      throw ('Error preparing point map.', error);
    }
  }

  destroy() {
    this._shapes.destroy();
    this._legend.destroy();
  }

  getDataUrl(vif, colorByCategories) {
    const columnName = vif.getColumnName();
    const colorByColumn = vif.getShapeColorByColumn();

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

    return `https://${vif.getDomain()}/resource/${vif.getDatasetUid()}.geojson?$query=` +
      `select ${selects.join(',')} ` +
      `where ${conditions.join(' AND ')} ` +
      `group by ${groups.join(',')} ` +
      'limit 200000 ' +
      '#substituteSoqlParams_tileParams={z}|{x}|{y}';
  }
}
