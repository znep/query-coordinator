import _ from 'lodash';

import {
  REQUEST_DATASET_METADATA,
  RECEIVE_DATASET_METADATA,
  HANDLE_DATASET_METADATA_ERROR
} from '../actions';

import defaultDatasetMetadata from '../defaultDatasetMetadata';

export default function datasetMetadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultDatasetMetadata;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_DATASET_METADATA:
      state.isLoading = true;

      state.error = null;
      state.hasError = false;

      state.data = null;
      state.hasData = false;
      break;

    case RECEIVE_DATASET_METADATA:
      state.isLoading = false;

      state.data = action.datasetMetadata;
      state.hasData = true;

      state.error = null;
      state.hasError = false;
      break;

    case HANDLE_DATASET_METADATA_ERROR:
      state.isLoading = false;

      state.data = null;
      state.hasData = false;

      state.error = action.error;
      state.hasError = true;
      break;
  }

  return state;
}
