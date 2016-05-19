import _ from 'lodash';

import {
  REQUEST_FEATURED_VIEWS,
  RECEIVE_FEATURED_VIEWS,
  HANDLE_FEATURED_VIEWS_ERROR,
  DISMISS_FEATURED_VIEWS_ERROR,
  TOGGLE_FEATURED_VIEWS
} from '../actions';

export default function(state, action) {
  if (_.isUndefined(state)) {
    return {
      list: _.take(window.initialState.featuredViews, 3),
      hasMore: window.initialState.featuredViews.length > 3,
      hasError: false,
      isLoading: false,
      isCollapsed: false
    };
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case REQUEST_FEATURED_VIEWS:
      state.isLoading = true;
      return state;

    case RECEIVE_FEATURED_VIEWS:
      state.list = state.list.concat(_.take(action.featuredViews, 3));
      state.hasMore = action.featuredViews.length > 3;
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
