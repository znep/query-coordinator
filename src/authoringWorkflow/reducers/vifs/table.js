import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import { getDisplayableColumns } from '../../selectors/metadata';
import { setStringValueOrDefaultValue } from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_FILTERS,
  SET_UNIT_ONE,
  SET_UNIT_OTHER
} from '../../actions';

export default function table(state, action) {
  if (_.isUndefined(state)) {
    return vifs().table;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().table;
      break;

    case RECEIVE_METADATA:
      let metadata = {
        datasetUid: '',
        domain: '',
        data: action.datasetMetadata
      };
      let displayableColumns = getDisplayableColumns(metadata);

      if (displayableColumns.length > 0) {

        setStringValueOrDefaultValue(
          state,
          'configuration.order[0].columnName',
          displayableColumns[0].fieldName
        );
      }

      state = baseVifReducer(state, action);
      break;

    case SET_DOMAIN:
    case SET_DATASET_UID:
    case SET_FILTERS:
    case SET_UNIT_ONE:
    case SET_UNIT_OTHER:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
