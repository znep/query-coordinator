import _ from 'lodash';

import utils from 'common/js_utils';

import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';
import { ALL_ASSETS_TAB, MY_ASSETS_TAB, SHARED_TO_ME_TAB } from 'common/components/AssetBrowser/lib/constants';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';
import * as headerActions from 'common/components/AssetBrowser/actions/header';

/*
 * Since we're now storing some of the redux state in the URL, that means that we've distributed "truth" into
 * two different locations. At initial page load, Rails sets the initialState from a combination of default
 * state and URL parameters. Subsequent user interactions update both Redux state _and_ URL query parameters.
 */

const getStaticData = (key) => _.get(window, `socrata.assetBrowser.staticData.${key}`);

export const getInitialState = () => {
  // Map all the domain's custom facets to an object of the facet param name to the value for
  // custom facets that have filters present in the URL query params.
  const customFacetFilters = (getStaticData('domainCustomFacets') || []).
    reduce((acc, customFacet) => {
      const customFacetValue = getQueryParameter(customFacet.param);
      if (customFacetValue) {
        acc[customFacet.param] = customFacetValue;
      }
      return acc;
    }, {});

  return {
    assetTypes: getQueryParameter('assetTypes'),
    authority: getQueryParameter('authority'),
    category: getQueryParameter('category'),
    customFacets: customFacetFilters,
    domainCustomFacets: getStaticData('domainCustomFacets') || [],
    domainCategories: getStaticData('domainCategories') || [],
    domainTags: getStaticData('domainTags') || [],
    onlyAwaitingApproval: false,
    onlyRecentlyViewed: false,
    ownedBy: {
      displayName: getQueryParameter('ownerName'),
      id: getQueryParameter('ownerId')
    },
    q: getQueryParameter('q'),
    tag: getQueryParameter('tag'),
    usersList: getStaticData('usersList') || [],
    visibility: getQueryParameter('visibility')
  };
};

// This function should _only_ be used for keeping track of user changes to the query. See also changeQ() in
// platform-ui/frontend/public/javascripts/internal_asset_manager/actions/filters.js
export const getCurrentQuery = () => getQueryParameter('q', '');

export const getUnfilteredState = (state) => ({
  assetTypes: null,
  authority: null,
  category: null,
  customFacets: {},
  domainCustomFacets: getStaticData('domainCustomFacets') || [],
  domainCategories: getStaticData('domainCategories') || [],
  domainTags: getStaticData('domainTags') || [],
  onlyAwaitingApproval: false,
  onlyRecentlyViewed: false,
  ownedBy: {
    displayName: null,
    id: null
  },
  q: getCurrentQuery(),
  tag: null,
  showAuthorityFilter: state.showAuthorityFilter,
  showOwnedByFilter: state.showOwnedByFilter,
  usersList: getStaticData('usersList') || [],
  visibility: null
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === filterActions.TOGGLE_AWAITING_APPROVAL) {
    return {
      ...state,
      onlyAwaitingApproval: !state.onlyAwaitingApproval
    };
  }

  if (action.type === filterActions.TOGGLE_RECENTLY_VIEWED) {
    return {
      ...state,
      onlyRecentlyViewed: !state.onlyRecentlyViewed
    };
  }

  if (action.type === filterActions.CHANGE_ASSET_TYPE) {
    return {
      ...state,
      assetTypes: action.value
    };
  }

  if (action.type === filterActions.CHANGE_AUTHORITY) {
    return {
      ...state,
      authority: action.value
    };
  }

  if (action.type === filterActions.CHANGE_CATEGORY) {
    return {
      ...state,
      category: action.value
    };
  }

  if (action.type === filterActions.CHANGE_OWNER) {
    return {
      ...state,
      ownedBy: action.value
    };
  }

  if (action.type === filterActions.CHANGE_TAG) {
    return {
      ...state,
      tag: action.value
    };
  }

  if (action.type === filterActions.CHANGE_VISIBILITY) {
    return {
      ...state,
      visibility: action.value
    };
  }

  if (action.type === filterActions.CHANGE_Q) {
    return {
      ...state,
      q: action.value
    };
  }

  if (action.type === filterActions.CHANGE_CUSTOM_FACET) {
    const newState = _.cloneDeep(state);
    if (action.value) {
      newState.customFacets[action.facetParam] = action.value;
    } else {
      delete newState.customFacets[action.facetParam];
    }
    return newState;
  }

  if (action.type === filterActions.CLEAR_SEARCH) {
    return {
      ...state,
      q: ''
    };
  }

  if (action.type === filterActions.CLEAR_ALL_FILTERS) {
    return getUnfilteredState(state);
  }

/*
 * Actions originating from Header component
 */

  if (action.type === headerActions.CHANGE_TAB) {

    const { newTab } = action;
    utils.assert(newTab, `${headerActions.CHANGE_TAB} action requires property: newTab`);

    if (action.newTab === MY_ASSETS_TAB || action.newTab === SHARED_TO_ME_TAB) {
      return getUnfilteredState(
        {
          ...state,
          showAuthorityFilter: false,
          showOwnedByFilter: false
        }
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
