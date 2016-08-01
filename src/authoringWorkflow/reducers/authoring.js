import _ from 'lodash';

import {
  SET_VISUALIZATION_TYPE,
  REQUEST_REGION_CODING,
  HANDLE_REGION_CODING_ERROR,
  REQUEST_CENTER_AND_ZOOM,
  SET_CENTER_AND_ZOOM,
  SET_COMPUTED_COLUMN,
  AWAIT_REGION_CODING,
  FINISH_REGION_CODING
} from '../actions';

export var defaultState = {
  selectedVisualizationType: null,
  showCenteringAndZoomingSaveMessage: false,
  showRegionCodingProcessingMessage: false,
  regionCodingError: null,
  regionCodingLastChecked: null,
  hasPannedOrZoomed: false
};

export default function authoring(state, action) {
  if (_.isUndefined(state)) {
    return defaultState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_VISUALIZATION_TYPE:
      state.selectedVisualizationType = action.visualizationType;
      state.hasPannedOrZoomed = false;
      break;

    case REQUEST_CENTER_AND_ZOOM:
      state.showCenteringAndZoomingSaveMessage = true;
      break;

    case SET_CENTER_AND_ZOOM:
      state.showCenteringAndZoomingSaveMessage = false;
      state.hasPannedOrZoomed = true;
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
  }

  return state;
}
