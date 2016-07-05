import _ from 'lodash';

import { POPULAR_VIEWS_CHUNK_SIZE } from '../lib/constants';

import {
  REQUEST_POPULAR_VIEWS,
  RECEIVE_POPULAR_VIEWS,
  HANDLE_POPULAR_VIEWS_ERROR,
  DISMISS_POPULAR_VIEWS_ERROR,
  TOGGLE_POPULAR_VIEWS
} from '../actionTypes';

var initialPopularViews = _.get(window.initialState, 'popularViews', []);
var initialState = {
  viewList: _.take(initialPopularViews, POPULAR_VIEWS_CHUNK_SIZE),
  hasMore: initialPopularViews.length > POPULAR_VIEWS_CHUNK_SIZE,
  hasError: false,
  isLoading: false,
  isCollapsed: false
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  switch (action.type) {
    case REQUEST_POPULAR_VIEWS:
      return {
        ...state,
        isLoading: true
      };

    case RECEIVE_POPULAR_VIEWS:
      var additionalViews = _.take(action.popularViews, POPULAR_VIEWS_CHUNK_SIZE);
      var viewList = _.clone(state.viewList).concat(additionalViews);

      return {
        ...state,
        viewList: viewList,
        hasMore: action.popularViews.length > POPULAR_VIEWS_CHUNK_SIZE,
        hasError: false,
        isLoading: false
      };

    case HANDLE_POPULAR_VIEWS_ERROR:
      return {
        ...state,
        hasError: true,
        isLoading: false
      };

    case DISMISS_POPULAR_VIEWS_ERROR:
      return {
        ...state,
        hasError: false
      };

    case TOGGLE_POPULAR_VIEWS:
      return {
        ...state,
        isCollapsed: !state.isCollapsed
      };

    default:
      return state;
  }
}
