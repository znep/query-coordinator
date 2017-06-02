import _ from 'lodash';

const getInitialState = () => ({
  assetTypes: null,
  lastUpdatedDate: 'anyDateUpdated',
  onlyRecentlyViewed: false,
  visibility: null
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'TOGGLE_RECENTLY_VIEWED') {
    return {
      ...state,
      onlyRecentlyViewed: !state.onlyRecentlyViewed
    };
  }

  if (action.type === 'CHANGE_LAST_UPDATED_DATE') {
    return {
      ...state,
      lastUpdatedDate: action.value
    };
  }

  if (action.type === 'CHANGE_ASSET_TYPE') {
    return {
      ...state,
      assetTypes: action.value
    };
  }

  if (action.type === 'CHANGE_VISIBILITY') {
    return {
      ...state,
      visibility: action.value
    };
  }

  return state;
};
