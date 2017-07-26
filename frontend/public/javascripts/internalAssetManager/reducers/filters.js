import _ from 'lodash';
import url from 'url';

export const getInitialState = () => ({
  assetTypes: _.get(window, 'initialState.initialFilters.assetTypes'),
  authority: _.get(window, 'initialState.initialFilters.authority'),
  category: _.get(window, 'initialState.initialFilters.category'),
  domainCategories: _.get(window, 'initialState.domainCategories') || [],
  domainTags: _.get(window, 'initialState.domainTags') || [],
  onlyRecentlyViewed: false,
  ownedBy: _.get(window, 'initialState.initialFilters.ownedBy'),
  q: _.get(url.parse(window.location.href, true), 'query.q', ''),
  tag: _.get(window, 'initialState.initialFilters.tag'),
  usersList: _.get(window, 'initialState.usersList') || [],
  visibility: _.get(window, 'initialState.initialFilters.visibility')
});

export const getUnfilteredState = () => ({
  assetTypes: null,
  authority: null,
  category: null,
  domainCategories: _.get(window, 'initialState.domainCategories') || [],
  domainTags: _.get(window, 'initialState.domainTags') || [],
  onlyRecentlyViewed: false,
  ownedBy: {
    displayName: '',
    id: null
  },
  q: null,
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

  if (action.type === 'CHANGE_Q') {
    return {
      ...state,
      q: action.value
    };
  }

  if (action.type === 'CLEAR_SEARCH') {
    return {
      ...state,
      q: null
    };
  }

  if (action.type === 'CLEAR_ALL_FILTERS') {
    return getUnfilteredState();
  }

  return state;
};
