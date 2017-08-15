import _ from 'lodash';

import { getQueryParameter } from '../actions/query_string.js';

/*
 * Since we're now storing some of the redux state in the URL, that means that we've distributed "truth" into
 * two different locations. At initial page load, Rails sets the initialState from a combination of default
 * state and URL parameters. Subsequent user interactions update both Redux state _and_ URL query parameters.
 */

export const getInitialState = () => ({
  assetTypes: _.get(window, 'initialState.initialFilters.assetTypes', null),
  authority: _.get(window, 'initialState.initialFilters.authority', null),
  category: _.get(window, 'initialState.initialFilters.category'),
  domainCategories: _.get(window, 'initialState.domainCategories') || [],
  domainTags: _.get(window, 'initialState.domainTags') || [],
  onlyRecentlyViewed: false,
  ownedBy: _.get(window, 'initialState.initialFilters.ownedBy'),
  q: _.get(window, 'initialState.q'),
  tag: _.get(window, 'initialState.initialFilters.tag'),
  usersList: _.get(window, 'initialState.usersList') || [],
  visibility: _.get(window, 'initialState.initialFilters.visibility', null)
});

// This function should _only_ be used for keeping track of user changes to the query. See also changeQ() in
// platform-ui/frontend/public/javascripts/internalAssetManager/actions/filters.js
export const getCurrentQuery = () => getQueryParameter({ key: 'q', defaultValue: '' });

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
  q: getCurrentQuery(),
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
      q: ''
    };
  }

  if (action.type === 'CLEAR_ALL_FILTERS') {
    return getUnfilteredState();
  }

  return state;
};
