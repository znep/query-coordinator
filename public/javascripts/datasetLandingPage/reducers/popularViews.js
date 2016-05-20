import _ from 'lodash';

import { POPULAR_VIEWS_CHUNK_SIZE } from '../lib/constants';

import {
  REQUEST_POPULAR_VIEWS,
  RECEIVE_POPULAR_VIEWS,
  HANDLE_POPULAR_VIEWS_ERROR,
  DISMISS_POPULAR_VIEWS_ERROR,
  TOGGLE_POPULAR_VIEWS
} from '../actions';

var initialPopularViews = _.get(window.initialState, 'popularViews', []);
var initialState = {
  list: _.take(initialPopularViews, POPULAR_VIEWS_CHUNK_SIZE),
  hasMore: initialPopularViews.length > POPULAR_VIEWS_CHUNK_SIZE,
  hasError: false,
  isLoading: false,
  isCollapsed: false
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_POPULAR_VIEWS:
      state.isLoading = true;
      return state;

    case RECEIVE_POPULAR_VIEWS:
      state.list = state.list.concat(_.take(action.popularViews, POPULAR_VIEWS_CHUNK_SIZE));
      state.hasMore = action.popularViews.length > POPULAR_VIEWS_CHUNK_SIZE;
      state.hasError = false;
      state.isLoading = false;
      return state;

    case HANDLE_POPULAR_VIEWS_ERROR:
      state.hasError = true;
      state.isLoading = false;
      return state;

    case DISMISS_POPULAR_VIEWS_ERROR:
      state.hasError = false;
      return state;

    case TOGGLE_POPULAR_VIEWS:
      state.isCollapsed = !state.isCollapsed;
      return state;

    default:
      return state;
  }
}
