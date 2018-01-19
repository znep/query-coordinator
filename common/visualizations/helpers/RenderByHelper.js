import _ from 'lodash';
import { COLOR_BY_BUCKETS_COUNT } from 'common/visualizations/views/mapConstants';

const RESIZE_BY_MIN_ALIAS = '__resize_by_min__';
const RESIZE_BY_AVG_ALIAS = '__resize_by_avg__';
const RESIZE_BY_MAX_ALIAS = '__resize_by_max__';
const COLOR_BY_CATEGORY_ALIAS = '__color_by_category__';
const COUNT_ALIAS = '__count__';

export default class RenderByHelper {
  // Fetches the top x(COLOR_BY_BUCKETS_COUNT) values in  colorByColumn based on row count.
  static async getColorByCategories(vif, pointDataset, colorByColumn) {
    if (!_.isString(colorByColumn)) {
      return null;
    }

    const query = `SELECT ${colorByColumn} as ${COLOR_BY_CATEGORY_ALIAS},count(*) as ${COUNT_ALIAS} ` +
      `GROUP BY ${colorByColumn} ` +
      `ORDER BY ${COUNT_ALIAS} desc ` +
      `LIMIT ${COLOR_BY_BUCKETS_COUNT}`;

    const results = await
      pointDataset.rawQuery(query);

    const categories = _.chain(results).reject((result) => _.isUndefined(result[COLOR_BY_CATEGORY_ALIAS])).map((result) => result[COLOR_BY_CATEGORY_ALIAS]).value();

    return categories;
  }

  static async getResizeByRange(vif, pointDataset, resizeByColumn) {
    if (!_.isString(resizeByColumn)) {
      return { min: 0, avg: 1, max: 1 };
    }

    const query = 'SELECT ' +
      `min(${resizeByColumn}) as ${RESIZE_BY_MIN_ALIAS},` +
      `avg(${resizeByColumn}) as ${RESIZE_BY_AVG_ALIAS},` +
      `max(${resizeByColumn}) as ${RESIZE_BY_MAX_ALIAS}`;

    const results = await
      pointDataset.rawQuery(query);
    const min = Number(_.get(results, `[0].${RESIZE_BY_MIN_ALIAS}`, 0));
    const avg = Number(_.get(results, `[0].${RESIZE_BY_AVG_ALIAS}`, 1));
    const max = Number(_.get(results, `[0].${RESIZE_BY_MAX_ALIAS}`, 1));

    return { min: min, avg: avg, max: max };
  }

}
