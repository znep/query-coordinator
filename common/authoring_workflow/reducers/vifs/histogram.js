import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import * as actions from '../../actions';

export default function histogram(state, action) {
  if (_.isUndefined(state)) {
    return vifs().histogram;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().histogram;
      break;

    case actions.APPEND_REFERENCE_LINE:
    case actions.RECEIVE_METADATA:
    case actions.REMOVE_REFERENCE_LINE:
    case actions.SET_DATASET_UID:
    case actions.SET_DESCRIPTION:
    case actions.SET_DIMENSION:
    case actions.SET_DOMAIN:
    case actions.SET_FILTERS:
    case actions.SET_LABEL_BOTTOM:
    case actions.SET_LABEL_LEFT:
    case actions.SET_MEASURE:
    case actions.SET_MEASURE_AGGREGATION:
    case actions.SET_MEASURE_AXIS_MAX_VALUE:
    case actions.SET_MEASURE_AXIS_MIN_VALUE:
    case actions.SET_PRIMARY_COLOR:
    case actions.SET_REFERENCE_LINE_COLOR:
    case actions.SET_REFERENCE_LINE_LABEL:
    case actions.SET_REFERENCE_LINE_VALUE:
    case actions.SET_SECONDARY_COLOR:
    case actions.SET_SHOW_LEGEND:
    case actions.SET_TITLE:
    case actions.SET_UNIT_ONE:
    case actions.SET_UNIT_OTHER:
    case actions.SET_VIEW_SOURCE_DATA_LINK:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
