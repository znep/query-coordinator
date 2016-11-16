import _ from 'lodash';

import { translate } from '../../../I18n';
import vifs from '../../vifs';
import {
  forEachSeries,
  getValidVifFilters,
  setStringValueOrDefaultValue,
  setStringValueOrDeleteProperty,
  setBooleanValueOrDefaultValue,
  setUnits,
  setBooleanValueOrDeleteProperty
} from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DATASET_UID,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_DOMAIN,
  SET_FILTERS,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_ORDER_BY,
  SET_TITLE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_SHOW_VALUE_LABELS,
  SET_SHOW_VALUE_LABELS_AS_PERCENT,
  SET_COLOR_PALETTE,
  SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY,
  SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY,
  SET_SHOW_OTHER_CATEGORY
} from '../../actions';

export default function pieChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().pieChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().pieChart;
      break;

    case RECEIVE_METADATA:
      forEachSeries(state, series => {
        setUnits(series, action);
      });
      break;

    case SET_DOMAIN:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.domain', action.domain, null);
      });
      break;

    case SET_DATASET_UID:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.datasetUid', action.datasetUid, null);
      });
      break;

    case SET_FILTERS:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.filters', getValidVifFilters(action.filters));
      });
      break;

    case SET_DIMENSION:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.dimension.columnName', action.dimension, null);
      });
      break;

    case SET_TITLE:
      setStringValueOrDefaultValue(state, 'title', action.title, null);
      break;

    case SET_DESCRIPTION:
      setStringValueOrDefaultValue(state, 'description', action.description, null);
      break;

    case SET_VIEW_SOURCE_DATA_LINK:
      _.set(state, 'configuration.viewSourceDataLink', action.viewSourceDataLink);
      break;

    case SET_COLOR_PALETTE:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.palette', action.colorPalette, null);
      });
      break;

    case SET_MEASURE:
      forEachSeries(state, series => {
        var aggregationFunction = series.dataSource.measure.aggregationFunction;

        series.dataSource.measure.columnName = action.measure;

        if (_.isNull(action.measure)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else if (aggregationFunction === 'count') {
          series.dataSource.measure.aggregationFunction = 'sum';
        }
      });
      break;

    case SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
      break;

    case SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
      break;

    case SET_SHOW_VALUE_LABELS_AS_PERCENT:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabelsAsPercent', action.showValueLabelsAsPercent, false);
      break;

    case SET_UNIT_ONE:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.unit.one'));
      });
      break;

    case SET_UNIT_OTHER:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.unit.other'));
      });
      break;

    case SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;

    case SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);

      forEachSeries(state, series => {
        _.unset(series, 'dataSource.limit');
      });
      break;

    case SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);

      forEachSeries(state, series => {
        _.set(series, 'dataSource.limit', action.limitCount);
      });
      break;

    case SET_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);
      break;
  }

  return state;
};
