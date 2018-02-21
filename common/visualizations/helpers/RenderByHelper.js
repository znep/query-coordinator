import _ from 'lodash';
import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';
import { COLOR_BY_BUCKETS_COUNT } from 'common/visualizations/views/mapConstants';

const RESIZE_BY_MIN_ALIAS = '__resize_by_min__';
const RESIZE_BY_AVG_ALIAS = '__resize_by_avg__';
const RESIZE_BY_MAX_ALIAS = '__resize_by_max__';
const COLOR_BY_CATEGORY_ALIAS = '__color_by_category__';
const COUNT_ALIAS = '__count__';

export default class RenderByHelper {
  // Fetches the top x(COLOR_BY_BUCKETS_COUNT) values in  colorByColumn based on row count.
  static async getColorByCategories(vif, colorByColumn) {
    if (!_.isString(colorByColumn)) {
      return null;
    }

    const datasetSoqlDataProvider = vif.getDatasetSoqlDataProvider();
    const query = `SELECT ${colorByColumn}||'' as ${COLOR_BY_CATEGORY_ALIAS},count(*) as ${COUNT_ALIAS} ` +
      `GROUP BY ${colorByColumn} ` +
      `ORDER BY ${COUNT_ALIAS} desc ` +
      `LIMIT ${COLOR_BY_BUCKETS_COUNT}`;

    const results = await datasetSoqlDataProvider.rawQuery(query);

    const categories = _.chain(results).reject((result) => _.isUndefined(result[COLOR_BY_CATEGORY_ALIAS])).map((result) => result[COLOR_BY_CATEGORY_ALIAS]).value();

    return categories;
  }

  static async getResizeByRange(vif, resizeByColumn) {
    if (!_.isString(resizeByColumn)) {
      return { min: 0, avg: 1, max: 1 };
    }

    const datasetSoqlDataProvider = vif.getDatasetSoqlDataProvider();
    const query = 'SELECT ' +
      `min(${resizeByColumn}) as ${RESIZE_BY_MIN_ALIAS},` +
      `avg(${resizeByColumn}) as ${RESIZE_BY_AVG_ALIAS},` +
      `max(${resizeByColumn}) as ${RESIZE_BY_MAX_ALIAS}`;


    const results = await datasetSoqlDataProvider.rawQuery(query);
    const min = Number(_.get(results, `[0].${RESIZE_BY_MIN_ALIAS}`, 0));
    const avg = Number(_.get(results, `[0].${RESIZE_BY_AVG_ALIAS}`, 1));
    const max = Number(_.get(results, `[0].${RESIZE_BY_MAX_ALIAS}`, 1));

    return { min: min, avg: avg, max: max };
  }

  static async getMeasuresForRegions(vif) {
    const domain = _.get(vif, 'series[0].dataSource.domain');
    const datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
    const nameColumn = vif.getMeasureForeignKey();
    const valueColumn = vif.getMeasureColumn();
    const valueFunction = vif.getMeasureAggregation();
    const nameAlias = '__shape_id__';
    const valueAlias = '__value__';
    const filters = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
    const requiredVifParams = [domain, datasetUid, nameColumn, valueColumn, valueFunction];
    const datasetSoqlDataProvider = vif.getDatasetSoqlDataProvider();

    if (!_.every(requiredVifParams, _.isString)) {
      return null;
    }

    let queryString = `SELECT ${nameColumn} as ${nameAlias}, ${valueFunction}(${valueColumn}) as ${valueAlias}` +
      ` GROUP BY ${nameColumn}`;

    if (!_.isEmpty(filters)) {
      queryString += ` WHERE ${filters.join(' AND ')}`;
    }
    queryString += ' LIMIT 10000';

    const measureResult = await datasetSoqlDataProvider.rawQuery(queryString);

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
}
