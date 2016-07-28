import _ from 'lodash';

import {
  REQUEST_METADATA,
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR
} from '../actions';

import defaultMetadata from '../defaultMetadata';

export default function metadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultMetadata;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_METADATA:
      state.isLoading = true;
      state.error = null;
      state.domain = action.domain;
      state.datasetUid = action.datasetUid;
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
      state.domain = null;
      state.datasetUid = null;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidesMetadata = null;
      state.error = action.error;
      break;
  }

  return state;
}
