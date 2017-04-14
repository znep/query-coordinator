import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import { getDisplayableColumns } from '../../selectors/metadata';
import { setStringValueOrDefaultValue } from '../../helpers';

import * as actions from '../../actions';

export default function table(state, action) {
  if (_.isUndefined(state)) {
    return vifs().table;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().table;
      break;

    case actions.RECEIVE_METADATA:
    case actions.SET_DOMAIN:
    case actions.SET_DATASET_UID:
    case actions.SET_FILTERS:
    case actions.SET_UNIT_ONE:
    case actions.SET_UNIT_OTHER:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
