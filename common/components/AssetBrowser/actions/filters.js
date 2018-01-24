import _ from 'lodash';
import { fetchResults } from 'common/components/AssetBrowser/lib/helpers/cetera';
import { updateQueryString } from 'common/components/AssetBrowser/lib/query_string';
import { getCurrentQuery, getUnfilteredState } from 'common/components/AssetBrowser/reducers/filters';
import * as autocompleteActions from 'common/autocomplete/actions';
import * as constants from 'common/components/AssetBrowser/lib/constants';

import { clearPage } from './pager';
import { clearSortOrder } from './sort_order';

export const CHANGE_ASSET_TYPE = 'CHANGE_ASSET_TYPE';
export const CHANGE_AUTHORITY = 'CHANGE_AUTHORITY';
export const CHANGE_CATEGORY = 'CHANGE_CATEGORY';
export const CHANGE_CUSTOM_FACET = 'CHANGE_CUSTOM_FACET';
export const CHANGE_OWNER = 'CHANGE_OWNER';
export const CHANGE_Q = 'CHANGE_Q';
export const CHANGE_TAG = 'CHANGE_TAG';
export const CHANGE_VISIBILITY = 'CHANGE_VISIBILITY';
export const CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS';
export const CLEAR_SEARCH = 'CLEAR_SEARCH';
export const TOGGLE_RECENTLY_VIEWED = 'TOGGLE_RECENTLY_VIEWED';
export const TOGGLE_AWAITING_APPROVAL = 'TOGGLE_AWAITING_APPROVAL';

export const toggleAwaitingApproval = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: TOGGLE_AWAITING_APPROVAL });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  const approvalStatus = getState().filters.approvalStatus === constants.APPROVAL_STATUS_PENDING ?
    null : constants.APPROVAL_STATUS_PENDING;

  return fetchResults(
    dispatch,
    getState,
    {
      action: TOGGLE_AWAITING_APPROVAL,
      approvalStatus,
      pageNumber: 1,
      q: getCurrentQuery()
    },
    onSuccess
  );
};

export const toggleRecentlyViewed = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: TOGGLE_RECENTLY_VIEWED });

    if (getState().filters.onlyRecentlyViewed) {
      dispatch(clearSortOrder());
    }
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  return fetchResults(
    dispatch,
    getState,
    {
      action: TOGGLE_RECENTLY_VIEWED,
      onlyRecentlyViewed: !getState().filters.onlyRecentlyViewed,
      sortByRecentlyViewed: !getState().filters.onlyRecentlyViewed,
      pageNumber: 1,
      q: getCurrentQuery()
    },
    onSuccess
  );
};

export const changeAssetType = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: CHANGE_ASSET_TYPE, value });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (value !== getState().filters.assetTypes) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_ASSET_TYPE,
        assetTypes: value,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeAuthority = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: CHANGE_AUTHORITY, value });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (value !== getState().filters.authority) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_AUTHORITY,
        authority: value,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeCategory = (option) => (dispatch, getState) => {
  const category = option.value;

  const onSuccess = () => {
    dispatch({ type: CHANGE_CATEGORY, value: category });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (category !== getState().filters.category) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_CATEGORY,
        category,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeOwner = (option) => (dispatch, getState) => {
  const owner = {
    displayName: option.title,
    id: option.value
  };

  const onSuccess = () => {
    dispatch({ type: CHANGE_OWNER, value: owner });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (owner.id !== getState().filters.ownedBy.id) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_OWNER,
        ownedBy: owner,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeTag = (option) => (dispatch, getState) => {
  const tag = option.value;

  const onSuccess = () => {
    dispatch({ type: CHANGE_TAG, value: tag });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (tag !== getState().filters.tag) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_TAG,
        tag,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeVisibility = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: CHANGE_VISIBILITY, value });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_VISIBILITY,
        visibility: value,
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const changeQ = (value) => {
  const FOUR_BY_FOUR_REGEX = /^\w{4}\-\w{4}$/;

  // This is the deafult search by query.
  const searchByQ = (dispatch, getState) => {
    const onSuccess = () => {
      dispatch({ type: CHANGE_Q, value });
      // EN-18325: Clear sort order for the cetera "relevance" default sort
      dispatch(clearSortOrder());
      clearPage(dispatch);
      updateQueryString({ getState });
    };

    return fetchResults(
      dispatch,
      getState,
      { action: CHANGE_Q, q: value, pageNumber: 1, order: undefined }, onSuccess
    );
  };

  // EN-18709: If the search string is a 4x4, then we should search on ids=4x4 instead.
  // If this fails, then we will fall back to the original search.
  if (FOUR_BY_FOUR_REGEX.test(value.trim())) {
    const ids = [value.trim()];
    return (dispatch, getState) => {
      const onSuccess = (notEmpty) => {
        if (notEmpty) {
          // EN-18325: Clear sort order for the cetera "relevance" default sort
          dispatch(clearSortOrder());
          clearPage(dispatch);
          updateQueryString({ getState });
        } else {
          searchByQ(dispatch, getState);
        }
      };

      return fetchResults(
        dispatch,
        getState,
        { action: CHANGE_Q, ids, q: null, pageNumber: 1, order: undefined }, onSuccess
      );
    };
  } else {
    return searchByQ;
  }
};

export const changeCustomFacet = (facetParam, value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: CHANGE_CUSTOM_FACET, facetParam, value });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  const existingCustomFacets = getState().filters.customFacets;

  if (value !== existingCustomFacets[facetParam]) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: CHANGE_CUSTOM_FACET,
        customFacets: { ...existingCustomFacets, [facetParam]: value },
        pageNumber: 1,
        q: getCurrentQuery()
      },
      onSuccess
    );
  }
};

export const clearSearch = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: CLEAR_SEARCH });
    dispatch(autocompleteActions.clearSearch()); // For autocomplete to update its text input
    clearPage(dispatch);
    updateQueryString({ getState, shouldClearSearch: true });
  };

  return fetchResults(dispatch, getState, { action: CLEAR_SEARCH, q: '', pageNumber: 1 }, onSuccess);
};

export const clearAllFilters = (options = {}) => (dispatch, getState) => {
  const shouldClearSearch = _.get(options, 'shouldClearSearch', false);
  const onSuccess = () => {
    dispatch({ type: CLEAR_ALL_FILTERS });
    if (shouldClearSearch) {
      dispatch({ type: CLEAR_SEARCH });
      dispatch(autocompleteActions.clearSearch()); // For autocomplete to update its text input
    }
    clearPage(dispatch);
    updateQueryString({ getState, shouldClearSearch });
  };

  const initialState = {
    ...getUnfilteredState(getState()),
    action: CLEAR_ALL_FILTERS,
    pageNumber: 1,
    q: getCurrentQuery()
  };

  if (shouldClearSearch) {
    initialState.q = '';
  }

  return fetchResults(dispatch, getState, initialState, onSuccess);
};
