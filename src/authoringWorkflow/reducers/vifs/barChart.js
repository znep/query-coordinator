import _ from 'lodash';
import utils from 'socrata-utils';

import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  setBooleanValueOrDefaultValue,
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

    case SET_SHOW_DIMENSION_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showDimensionLabels', action.showDimensionLabels, true);
      break;

    case SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
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

    case RECEIVE_METADATA:
    case SET_DATASET_UID:
    case SET_DESCRIPTION:
    case SET_DIMENSION:
    case SET_DOMAIN:
    case SET_FILTERS:
    case SET_LABEL_TOP:
    case SET_LABEL_BOTTOM:
    case SET_LABEL_LEFT:
    case SET_LABEL_RIGHT:
    case SET_MEASURE:
    case SET_MEASURE_AGGREGATION:
    case SET_MEASURE_AXIS_MAX_VALUE:
    case SET_MEASURE_AXIS_MIN_VALUE:
    case SET_PRIMARY_COLOR:
    case SET_SECONDARY_COLOR:
    case SET_TITLE:
    case SET_UNIT_ONE:
    case SET_UNIT_OTHER:
    case SET_VIEW_SOURCE_DATA_LINK:
    case SET_X_AXIS_SCALING_MODE:
      return baseVifReducer(state, action);
  }

  return state;
}
