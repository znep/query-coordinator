import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import { forEachSeries, setBooleanValueOrDeleteProperty } from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_FILTERS,
  SET_DIMENSION,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  SET_LABEL_BOTTOM,
  SET_LABEL_LEFT,
  SET_X_AXIS_SCALING_MODE,
  SET_MEASURE_AXIS_MIN_VALUE,
  SET_MEASURE_AXIS_MAX_VALUE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_PRECISION,
  SET_TREAT_NULL_VALUES_AS_ZERO
} from '../../actions';

export default function timelineChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().timelineChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().timelineChart;
      break;

    case SET_PRECISION:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.precision', action.precision);
      });
      break;

    case SET_TREAT_NULL_VALUES_AS_ZERO:
      setBooleanValueOrDeleteProperty(state, 'configuration.treatNullValuesAsZero', action.treatNullValuesAsZero);
      break;

    case RECEIVE_METADATA:
    case SET_DATASET_UID:
    case SET_DESCRIPTION:
    case SET_DIMENSION:
    case SET_DOMAIN:
    case SET_FILTERS:
    case SET_LABEL_BOTTOM:
    case SET_LABEL_LEFT:
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

    default:
      break;
  }

  return state;
}
