import _ from 'lodash';
import { SET_VISUALIZATION_TYPE, REQUEST_CENTER_AND_ZOOM, SET_CENTER_AND_ZOOM } from '../actions';

export default function authoring(state, action) {
  if (_.isUndefined(state)) {
    return {
      selectedVisualizationType: null,
      showCenteringAndZoomingSaveMessage: false
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
  }

  return state;
}
