import _ from 'lodash';

import utils from 'common/js_utils';
import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';
import { ALL_ASSETS_TAB, MY_ASSETS_TAB, SHARED_TO_ME_TAB } from 'common/components/AssetBrowser/lib/constants';
import { getCurrentUserFilter } from 'common/components/AssetBrowser/lib/cetera_helpers';

/*
 * Since we're now storing some of the redux state in the URL, that means that we've distributed "truth" into
 * two different locations. At initial page load, Rails sets the initialState from a combination of default
 * state and URL parameters. Subsequent user interactions update both Redux state _and_ URL query parameters.
 */

export const getInitialState = () => {
  // Map all the domain's custom facets to an object of the facet param name to the value for
  // custom facets that have filters present in the URL query params.
  const customFacetFilters = (_.get(window, 'initialState.domainCustomFacets') || []).
    reduce((acc, customFacet) => {
      const customFacetValue = getQueryParameter({ key: [customFacet.param] });
      if (customFacetValue) {
        acc[customFacet.param] = customFacetValue;
      }
      return acc;
    }, {});

  return {
    assetTypes: getQueryParameter({ key: 'assetTypes' }),
    authority: getQueryParameter({ key: 'authority' }),
    category: getQueryParameter({ key: 'category' }),
    customFacets: customFacetFilters,
    domainCustomFacets: _.get(window, 'initialState.domainCustomFacets') || [],
    domainCategories: _.get(window, 'initialState.domainCategories') || [],
    domainTags: _.get(window, 'initialState.domainTags') || [],
    onlyRecentlyViewed: false,
    ownedBy: {
      displayName: getQueryParameter({ key: 'ownerName' }),
      id: getQueryParameter({ key: 'ownerId' })
    },
    q: getQueryParameter({ key: 'q' }),
    tag: getQueryParameter({ key: 'tag' }),
    usersList: _.get(window, 'initialState.usersList') || [],
    visibility: getQueryParameter({ key: 'visibility' })
  };
};

// This function should _only_ be used for keeping track of user changes to the query. See also changeQ() in
// platform-ui/frontend/public/javascripts/internalAssetManager/actions/filters.js
export const getCurrentQuery = () => getQueryParameter({ key: 'q', defaultValue: '' });

export const getUnfilteredState = (state, baseFilters = {}) => ({
  assetTypes: null,
  authority: null,
  baseFilters,
  category: null,
  customFacets: {},
  domainCustomFacets: _.get(window, 'initialState.domainCustomFacets') || [],
  domainCategories: _.get(window, 'initialState.domainCategories') || [],
  domainTags: _.get(window, 'initialState.domainTags') || [],
  onlyRecentlyViewed: false,
  ownedBy: {
    displayName: null,
    id: null
  },
  q: getCurrentQuery(),
  tag: null,
  showAuthorityFilter: state.showAuthorityFilter,
  showOwnedByFilter: state.showOwnedByFilter,
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

  if (action.type === 'CHANGE_BASE_FILTER') {
    return {
      ...state,
      baseFilter: action.baseFilter
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

  if (action.type === 'CHANGE_CUSTOM_FACET') {
    const newState = _.cloneDeep(state);
    if (action.value) {
      newState.customFacets[action.facetParam] = action.value;
    } else {
      delete newState.customFacets[action.facetParam];
    }
    return newState;
  }

  if (action.type === 'CLEAR_SEARCH') {
    return {
      ...state,
      q: ''
    };
  }

  if (action.type === 'CLEAR_ALL_FILTERS') {
    return getUnfilteredState(state, action.baseFilters);
  }

/*
 * Actions originating from Header component
 */

  if (action.type === 'CHANGE_TAB') {

    const { newTab } = action;
    utils.assert(newTab, 'CHANGE_TAB action requires property: newTab');

    if (action.newTab === MY_ASSETS_TAB || action.newTab === SHARED_TO_ME_TAB) {
      return getUnfilteredState(
        {
          ...state,
          showAuthorityFilter: false,
          showOwnedByFilter: false
        },
        getCurrentUserFilter()
      );
    }
    if (action.newTab === ALL_ASSETS_TAB) {
      return getUnfilteredState(
        {
          ...state,
          showAuthorityFilter: true,
          showOwnedByFilter: true
        }
      );
    }
  }

  return state;
};
