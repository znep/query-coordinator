import _ from 'lodash';

import {
  SET_VISUALIZATION_TYPE,
  REQUEST_REGION_CODING,
  HANDLE_REGION_CODING_ERROR,
  REQUEST_CENTER_AND_ZOOM,
  SET_CENTER_AND_ZOOM,
  SET_COMPUTED_COLUMN
} from '../actions';

export var defaultState = {
  selectedVisualizationType: null,
  showCenteringAndZoomingSaveMessage: false,
  showRegionCodingProcessingMessage: false,
  regionCodingError: null
};

export var defaultState = {
  selectedVisualizationType: null,
  showCenteringAndZoomingSaveMessage: false,
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
      break;

    case HANDLE_REGION_CODING_ERROR:
      state.showRegionCodingProcessingMessage = false;
      state.regionCodingError = action.error;
      break;

    case SET_COMPUTED_COLUMN:
      state.showRegionCodingProcessingMessage = false;
      state.regionCodingError = null;
      break;
  }

  return state;
}
