import _ from 'lodash';

import {
  REQUEST_METADATA,
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR
} from '../actions';

import defaultDatasetMetadata from '../defaultDatasetMetadata';

export default function datasetMetadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultDatasetMetadata;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_METADATA:
      state.isLoading = true;
      state.error = null;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidiesMetadata = null;
      break;

    case RECEIVE_METADATA:
      state.isLoading = false;
      state.error = null;
      state.data = action.datasetMetadata;
      state.curatedRegions = action.curatedRegions;
      state.phidippidiesMetadata = action.phidippidiesMetadata;
      break;

    case HANDLE_METADATA_ERROR:
      state.isLoading = false;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidiesMetadata = null;
      state.error = action.error;
      break;
  }

  return state;
}
