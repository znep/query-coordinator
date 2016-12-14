import _ from 'lodash';

import {
  RESET_STATE,
  REQUEST_METADATA,
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR,
  SET_PHIDIPPIDES_METADATA
} from '../actions';

export var defaultState = {
  isLoading: false,
  error: null,
  domain: null,
  datasetUid: null,
  data: null,
  curatedRegions: null,
  phidippidesMetadata: null
};

export default function metadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    // Return with defaultState on reset
    case RESET_STATE:
      state = defaultState;
      break;

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
      state.hasColumnStats = action.hasColumnStats;
      break;

    case HANDLE_METADATA_ERROR:
      state.isLoading = false;
      state.error = action.error;
      state.domain = null;
      state.datasetUid = null;
      state.data = null;
      state.curatedRegions = null;
      state.phidippidesMetadata = null;
      break;

    case SET_PHIDIPPIDES_METADATA:
      state.phidippidesMetadata = action.phidippidesMetadata;
      break;
  }

  return state;
}