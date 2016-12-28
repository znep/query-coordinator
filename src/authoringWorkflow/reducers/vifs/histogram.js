import _ from 'lodash';
import utils from 'socrata-utils';

import vifs from '../../vifs';
import baseVifReducer from './base';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DIMENSION,
  SET_FILTERS,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  SET_LABEL_TOP,
  SET_LABEL_BOTTOM,
  SET_LABEL_LEFT,
  SET_LABEL_RIGHT,
  SET_X_AXIS_SCALING_MODE,
  SET_MEASURE_AXIS_MIN_VALUE,
  SET_MEASURE_AXIS_MAX_VALUE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_VIEW_SOURCE_DATA_LINK
} from '../../actions';

export default function histogram(state, action) {
  if (_.isUndefined(state)) {
    return vifs().histogram;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().histogram;
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
