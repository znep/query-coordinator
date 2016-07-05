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

  switch (action.type) {
    case REQUESTED_DERIVED_VIEWS:
      return {
        ...state,
        isLoading: true
      };

    case HANDLE_DERIVED_VIEWS_REQUEST_ERROR:
      return {
        ...state,
        isLoading: false,
        hasError: true
      };

    case RECEIVE_DERIVED_VIEWS:
      return {
        ...state,
        isLoading: false,
        viewList: action.views
      };

    default:
      return state;
  }
}
