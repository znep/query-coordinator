import _ from 'lodash';
import {
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

  state = _.cloneDeep(state);

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

    default:
      return state;
  }
}
