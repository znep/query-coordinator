import _ from 'lodash';

import {
  REQUEST_METADATA,
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR
} from '../actions';

export var defaultState = {
  isLoading: false,
  data: null,
  curatedRegions: null,
  phidippidesMetadata: null,
  error: null
};

export default function metadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_METADATA:
      state.isLoading = true;
      state.error = null;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidesMetadata = null;
      break;

    case RECEIVE_METADATA:
      state.isLoading = false;
      state.error = null;
      state.data = action.datasetMetadata;
      state.curatedRegions = action.curatedRegions;
      state.phidippidesMetadata = action.phidippidesMetadata;
      break;

    case HANDLE_METADATA_ERROR:
      state.isLoading = false;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidesMetadata = null;
      state.error = action.error;
      break;
  }

  return state;
}
