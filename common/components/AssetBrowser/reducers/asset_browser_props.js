import _ from 'lodash';

export default (state, action) => {
  if (_.isUndefined(state)) {
    return {};
  }

  // Props should only be set once, on page load. See asset_browser_wrapper component.
  if (action.type === 'SET_ASSET_BROWSER_PROPS') {
    return {
      ...state,
      ...action.assetBrowserProps
    };
  }

  return state;
};
