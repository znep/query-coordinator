import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../../I18n';
import vifs from '../../vifs';
import {
  forEachSeries,
  getValidVifFilters,
  setStringValueOrDefaultValue,
  setBooleanValueOrDefaultValue,
  setStringValueOrDeleteProperty,
  setNumericValueOrDeleteProperty,
  setBooleanValueOrDeleteProperty,
  setUnits,
  isNonEmptyString
} from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DATASET_UID,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_DOMAIN,
  SET_FILTERS,
  SET_LABEL_BOTTOM,
  SET_LABEL_LEFT,
  SET_LABEL_RIGHT,
  SET_LABEL_TOP,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_ORDER_BY,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  SET_TITLE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_SHOW_DIMENSION_LABELS,
  SET_SHOW_VALUE_LABELS,
  SET_X_AXIS_SCALING_MODE,
  SET_MEASURE_AXIS_MIN_VALUE,
  SET_MEASURE_AXIS_MAX_VALUE,
  SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY,
  SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY,
  SET_SHOW_OTHER_CATEGORY
} from '../../actions';

export default function barChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().barChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().barChart;
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

    case SET_PRIMARY_COLOR:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.primary', action.primaryColor);
      });
      break;

    case SET_SECONDARY_COLOR:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.secondary', action.secondaryColor);
      });
      break;

    case SET_LABEL_TOP:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.top', action.labelTop);
      break;

    case SET_LABEL_BOTTOM:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.bottom', action.labelBottom);
      break;

    case SET_LABEL_LEFT:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.left', action.labelLeft);
      break;

    case SET_LABEL_RIGHT:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.right', action.labelRight);
      break;

    case SET_SHOW_DIMENSION_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showDimensionLabels', action.showDimensionLabels, true);
      break;

    case SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
      break;

    case SET_X_AXIS_SCALING_MODE:
      setStringValueOrDeleteProperty(state, 'configuration.xAxisScalingMode', action.xAxisScalingMode);
      break;

    case SET_MEASURE_AXIS_MIN_VALUE:
      setNumericValueOrDeleteProperty(state, 'configuration.measureAxisMinValue', action.measureAxisMinValue);
      break;

    case SET_MEASURE_AXIS_MAX_VALUE:
      setNumericValueOrDeleteProperty(state, 'configuration.measureAxisMaxValue', action.measureAxisMaxValue);
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
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);

      forEachSeries(state, series => {
        _.set(series, 'dataSource.limit', parseInt(action.limitCount, 10));
      });
      break;

    case SET_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);
      break;
  }

  return state;
}
