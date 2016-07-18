import _ from 'lodash';
import {
  SET_VISUALIZATION_TYPE,
  REQUEST_REGION_CODING,
  HANDLE_REGION_CODING_ERROR,
  REQUEST_CENTER_AND_ZOOM,
  SET_CENTER_AND_ZOOM
} from '../actions';

export default function authoring(state, action) {
  if (_.isUndefined(state)) {
    return {
      selectedVisualizationType: null,
      showCenteringAndZoomingSaveMessage: false,
      showRegionCodingProcessingMessage: false,
      regionCodingError: null
    };
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_VISUALIZATION_TYPE:
      state.selectedVisualizationType = action.visualizationType;
      break;

    case REQUEST_CENTER_AND_ZOOM:
      state.showCenteringAndZoomingSaveMessage = true;
      break;

    case SET_CENTER_AND_ZOOM:
      state.showCenteringAndZoomingSaveMessage = false;
      break;

    case REQUEST_REGION_CODING:
      state.showRegionCodingProcessingMessage = true;
      state.regionCodingError = null;
      break;

    case HANDLE_REGION_CODING_ERROR:
      state.showRegionCodingProcessingMessage = false;
      state.regionCodingError = action.error;
  }

  return state;
}
