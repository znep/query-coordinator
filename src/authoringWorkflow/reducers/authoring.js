import _ from 'lodash';
import { SET_VISUALIZATION_TYPE, REQUEST_CENTER_AND_ZOOM, SET_CENTER_AND_ZOOM } from '../actions';

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
  }

  return state;
}
