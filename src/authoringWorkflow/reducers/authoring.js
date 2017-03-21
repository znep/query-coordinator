import _ from 'lodash';

import {
  RESET_STATE,
  SET_FILTERS,
  AWAIT_REGION_CODING,
  FINISH_REGION_CODING,
  HANDLE_REGION_CODING_ERROR,
  REQUEST_REGION_CODING,
  SET_COMPUTED_COLUMN,
  SET_VIF_CHECKPOINT,
  SET_VISUALIZATION_TYPE,
  SET_USER_ACTIVE,
  SET_USER_IDLE,
  SET_MAP_INFO_DISMISSED
} from '../actions';

export var defaultState = {
  selectedVisualizationType: null,
  mapInfoDismissed: false,
  showRegionCodingProcessingMessage: false,
  regionCodingError: null,
  regionCodingLastChecked: null,
  hasPannedOrZoomed: false,
  filters: [],
  userCurrentlyActive: false,
};

export default function authoring(state, action) {
  if (_.isUndefined(state)) {
    return defaultState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = defaultState;
      break;

    case SET_FILTERS:
      state.filters = _.cloneDeep(action.filters);
      break;

    case SET_VIF_CHECKPOINT:
      state.checkpointVifs = _.cloneDeep(action.vifs);
      break;

    case SET_VISUALIZATION_TYPE:
      state.selectedVisualizationType = action.visualizationType;
      state.hasPannedOrZoomed = false;
      break;

    case SET_MAP_INFO_DISMISSED:
      state.mapInfoDismissed = true;
      break;

    case REQUEST_REGION_CODING:
      state.showRegionCodingProcessingMessage = true;
      state.regionCodingError = null;
      state.regionCodingLastChecked = null;
      break;

    case HANDLE_REGION_CODING_ERROR:
      state.showRegionCodingProcessingMessage = false;
      state.regionCodingError = action.error;
      break;

    case FINISH_REGION_CODING:
      state.showRegionCodingProcessingMessage = false;
      state.regionCodingError = null;
      break;

    case AWAIT_REGION_CODING:
      state.regionCodingLastChecked = action.updatedAt;
      break;

    case SET_USER_ACTIVE:
      state.userCurrentlyActive = true;
      break;

    case SET_USER_IDLE:
      state.userCurrentlyActive = false;
      break;
  }

  return state;
}
