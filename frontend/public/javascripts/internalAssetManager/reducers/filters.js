import _ from 'lodash';

const getInitialState = () => ({
  assetTypes: null,
  authority: null,
  category: null,
  domainCategories: _.get(window, 'initialState.domainCategories') || [],
  domainTags: _.get(window, 'initialState.domainTags') || [],
  lastUpdatedDate: 'anyDateUpdated',
  onlyRecentlyViewed: false,
  ownedBy: {
    displayName: '',
    id: null
  },
  tag: null,
  usersList: _.get(window, 'initialState.usersList') || [],
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

  if (action.type === 'CHANGE_AUTHORITY') {
    return {
      ...state,
      authority: action.value
    };
  }

  if (action.type === 'CHANGE_CATEGORY') {
    return {
      ...state,
      category: action.value
    };
  }

  if (action.type === 'CHANGE_OWNER') {
    return {
      ...state,
      ownedBy: action.value
    };
  }

  if (action.type === 'CHANGE_TAG') {
    return {
      ...state,
      tag: action.value
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
