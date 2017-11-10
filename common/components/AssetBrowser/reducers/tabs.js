import _ from 'lodash';

export default (state, action) => {
  if (_.isUndefined(state)) {
    return {};
  }

  // Tabs should only be set once, on page load. See asset_browser_wrapper component.
  if (action.type === 'SET_TABS') {
    return {
      ...state,
      ...action.tabs
    };
  }

  return state;
};
