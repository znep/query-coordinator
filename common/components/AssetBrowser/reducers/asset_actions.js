import _ from 'lodash';

import * as assetActions from 'common/components/AssetBrowser/actions/asset_actions';

const getInitialState = () => ({
  activeActionModalType: null,
  activeActionForUid: null,
  alert: {},
  performingAction: false,
  performingActionSuccess: false,
  performingActionFailure: false
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === assetActions.SHOW_MODAL) {
    return {
      ...state,
      activeActionModalType: action.modalType,
      activeActionForUid: action.uid
    };
  }

  if (action.type === assetActions.CLOSE_MODAL) {
    return {
      ...state,
      activeActionModalType: null,
      activeActionForUid: null
    };
  }

  if (action.type === assetActions.PERFORMING_ACTION) {
    return {
      ...state,
      performingAction: true,
      performingActionSuccess: false,
      performingActionFailure: false
    };
  }

  if (action.type === assetActions.PERFORMING_ACTION_SUCCESS) {
    return {
      ...state,
      performingAction: false,
      performingActionSuccess: true,
      performingActionFailure: false
    };
  }

  if (action.type === assetActions.PERFORMING_ACTION_FAILURE) {
    return {
      ...state,
      performingAction: false,
      performingActionSuccess: false,
      performingActionFailure: true,
      actionResponse: action.response
    };
  }

  if (action.type === assetActions.SHOW_ALERT) {
    return {
      ...state,
      alert: {
        title: action.title,
        body: action.body,
        time: action.time
      }
    };
  }

  if (action.type === assetActions.HIDE_ALERT) {
    return {
      ...state,
      alert: {}
    };
  }

  return state;
};
