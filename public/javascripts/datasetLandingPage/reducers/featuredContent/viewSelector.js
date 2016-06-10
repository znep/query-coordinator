import _ from 'lodash';
import {
  REQUESTED_DERIVED_VIEWS,
  HANDLE_DERIVED_VIEWS_REQUEST_ERROR,
  RECEIVE_DERIVED_VIEWS
} from '../../actionTypes';

var initialState = {
  hasError: false,
  isLoading: false,
  viewList: []
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUESTED_DERIVED_VIEWS:
      state.isLoading = true;
      return state;

    case HANDLE_DERIVED_VIEWS_REQUEST_ERROR:
      state.isLoading = false;
      state.hasError = true;
      return state;

    case RECEIVE_DERIVED_VIEWS:
      state.isLoading = false;
      state.viewList = action.views;
      return state;

    default:
      return state;
  }
}
