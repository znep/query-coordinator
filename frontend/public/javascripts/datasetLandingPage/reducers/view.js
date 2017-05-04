import _ from 'lodash';
import {
  HANDLE_FETCH_ROW_COUNT_SUCCESS,
  HANDLE_FETCH_ROW_COUNT_ERROR,
  REQUESTED_VIEW_PUBLISH,
  HANDLE_VIEW_PUBLISH_SUCCESS,
  HANDLE_VIEW_PUBLISH_ERROR,
  CLEAR_VIEW_PUBLISH_ERROR
} from '../actionTypes';

function getInitialState() {
  return _.extend({}, _.get(window.initialState, 'view', {}), {
    isPublishing: false,
    hasPublishingError: false,
    hasPublishingSuccess: false
  });
}

export default function(state, action) {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  switch (action.type) {
    case REQUESTED_VIEW_PUBLISH:
      return {
        ...state,
        isPublishing: true,
        hasPublishingSuccess: false,
        hasPublishingError: false
      };

    case HANDLE_VIEW_PUBLISH_SUCCESS:
      return {
        ...state,
        isPublishing: false,
        hasPublishingSuccess: true,
        hasPublishingError: false
      };

    case HANDLE_VIEW_PUBLISH_ERROR:
      return {
        ...state,
        isPublishing: false,
        hasPublishingSuccess: false,
        hasPublishingError: true
      };

    case CLEAR_VIEW_PUBLISH_ERROR:
      return {
        ...state,
        hasPublishingError: false
      };

    case HANDLE_FETCH_ROW_COUNT_SUCCESS:
      return {
        ...state,
        rowCount: action.rowCount
      };

    case HANDLE_FETCH_ROW_COUNT_ERROR:
      return {
        ...state,
        rowCount: null
      };

    default:
      return state;
  }
}