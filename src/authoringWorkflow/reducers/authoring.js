import _ from 'lodash';
import { SET_VISUALIZATION_TYPE } from '../actions';

export default function authoring(state, action) {
  if (_.isUndefined(state)) {
    return { selectedVisualizationType: null };
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_VISUALIZATION_TYPE:
      state.selectedVisualizationType = action.visualizationType;
      break;
  }

  return state;
}
