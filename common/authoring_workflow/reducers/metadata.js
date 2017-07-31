import _ from 'lodash';

import * as actions from '../actions';

export var defaultState = {
  isLoading: false,
  error: null,
  domain: null,
  datasetUid: null,
  data: null,
  isCuratedRegionsLoading: false,
  hasCuratedRegionsError: false,
  curatedRegions: null
};

export default function metadata(state, action) {
  if (_.isUndefined(state)) {
    return defaultState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    // Return with defaultState on reset
    case actions.RESET_STATE:
      state = defaultState;
      break;

    case actions.REQUEST_METADATA:
      state.isLoading = true;
      state.error = null;
      state.domain = action.domain;
      state.datasetUid = action.datasetUid;
      state.data = null;
      break;

    case actions.RECEIVE_METADATA:
      state.isLoading = false;
      state.error = null;
      state.data = action.datasetMetadata;
      state.hasColumnStats = action.hasColumnStats;
      break;

    case actions.HANDLE_METADATA_ERROR:
      state.isLoading = false;
      state.error = action.error;
      state.domain = null;
      state.datasetUid = null;
      state.data = null;
      break;

    case actions.REQUEST_CURATED_REGIONS:
      state.isCuratedRegionsLoading = true;
      state.hasCuratedRegionsError = false;
      state.curatedRegions = null;
      break;

    case actions.RECEIVE_CURATED_REGIONS:
      state.isCuratedRegionsLoading = false;
      state.hasCuratedRegionsError = false;
      state.curatedRegions = action.curatedRegions;
      break;

    case actions.HANDLE_CURATED_REGIONS_ERROR:
      state.isCuratedRegionsLoading = false;
      state.hasCuratedRegionsError = true;
      state.curatedRegions = null;
      break;
  }

  return state;
}
