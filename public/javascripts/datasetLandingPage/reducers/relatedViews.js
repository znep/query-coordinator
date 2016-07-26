import _ from 'lodash';

import { RELATED_VIEWS_CHUNK_SIZE } from '../lib/constants';

import {
  REQUEST_RELATED_VIEWS,
  RECEIVE_RELATED_VIEWS,
  HANDLE_RELATED_VIEWS_ERROR,
  DISMISS_RELATED_VIEWS_ERROR,
  TOGGLE_RELATED_VIEWS
} from '../actionTypes';

var initialRelatedViews = _.get(window.initialState, 'relatedViews', []);
var initialState = {
  viewList: _.take(initialRelatedViews, RELATED_VIEWS_CHUNK_SIZE),
  hasMore: initialRelatedViews.length > RELATED_VIEWS_CHUNK_SIZE,
  hasError: false,
  isLoading: false,
  isCollapsed: false
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  switch (action.type) {
    case REQUEST_RELATED_VIEWS:
      return {
        ...state,
        isLoading: true
      };

    case RECEIVE_RELATED_VIEWS:
      var additionalViews = _.take(action.relatedViews, RELATED_VIEWS_CHUNK_SIZE);
      var viewList = _.clone(state.viewList).concat(additionalViews);

      return {
        ...state,
        viewList: viewList,
        hasMore: action.relatedViews.length > RELATED_VIEWS_CHUNK_SIZE,
        hasError: false,
        isLoading: false
      };

    case HANDLE_RELATED_VIEWS_ERROR:
      return {
        ...state,
        hasError: true,
        isLoading: false
      };

    case DISMISS_RELATED_VIEWS_ERROR:
      return {
        ...state,
        hasError: false
      };

    case TOGGLE_RELATED_VIEWS:
      return {
        ...state,
        isCollapsed: !state.isCollapsed
      };

    default:
      return state;
  }
}
