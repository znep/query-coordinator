import _ from 'lodash';

import { FEATURED_VIEWS_CHUNK_SIZE } from '../lib/constants';

import {
  REQUEST_FEATURED_VIEWS,
  RECEIVE_FEATURED_VIEWS,
  HANDLE_FEATURED_VIEWS_ERROR,
  DISMISS_FEATURED_VIEWS_ERROR,
  TOGGLE_FEATURED_VIEWS
} from '../actions';

var initialFeaturedViews = _.get(window.initialState, 'featuredViews', []);
var initialState = {
  list: _.take(initialFeaturedViews, FEATURED_VIEWS_CHUNK_SIZE),
  hasMore: initialFeaturedViews.length > FEATURED_VIEWS_CHUNK_SIZE,
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
    case REQUEST_FEATURED_VIEWS:
      state.isLoading = true;
      return state;

    case RECEIVE_FEATURED_VIEWS:
      state.list = state.list.concat(_.take(action.featuredViews, FEATURED_VIEWS_CHUNK_SIZE));
      state.hasMore = action.featuredViews.length > FEATURED_VIEWS_CHUNK_SIZE;
      state.hasError = false;
      state.isLoading = false;
      return state;

    case HANDLE_FEATURED_VIEWS_ERROR:
      state.hasError = true;
      state.isLoading = false;
      return state;

    case DISMISS_FEATURED_VIEWS_ERROR:
      state.hasError = false;
      return state;

    case TOGGLE_FEATURED_VIEWS:
      state.isCollapsed = !state.isCollapsed;
      return state;

    default:
      return state;
  }
}
