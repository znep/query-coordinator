import { fetchResults } from './cetera';
import { clearPage } from './pager';
import { updateQueryString } from './query_string';
import { getUnfilteredState } from '../reducers/filters';

export const toggleRecentlyViewed = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'TOGGLE_RECENTLY_VIEWED' });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  return fetchResults(
    dispatch,
    getState,
    {
      action: 'TOGGLE_RECENTLY_VIEWED',
      onlyRecentlyViewed: !getState().filters.onlyRecentlyViewed,
      pageNumber: 1
    },
    onSuccess
  );
};

export const changeAssetType = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_ASSET_TYPE', value });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (value !== getState().filters.assetTypes) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: 'CHANGE_ASSET_TYPE',
        assetTypes: value,
        pageNumber: 1
      },
      onSuccess
    );
  }
};

export const changeAuthority = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_AUTHORITY', value });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (value !== getState().filters.authority) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: 'CHANGE_AUTHORITY',
        authority: value,
        pageNumber: 1
      },
      onSuccess
    );
  }
};

export const changeCategory = (option) => (dispatch, getState) => {
  const category = option.value;

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_CATEGORY', value: category });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (category !== getState().filters.category) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: 'CHANGE_CATEGORY',
        category,
        pageNumber: 1
      },
      onSuccess
    );
  }
};

export const changeOwner = (option) => (dispatch, getState) => {
  const owner = { displayName: option.title, id: option.value };

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_OWNER', value: owner });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (owner.id !== getState().filters.ownedBy.id) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: 'CHANGE_OWNER',
        ownedBy: owner,
        pageNumber: 1
      },
      onSuccess
    );
  }
};

export const changeTag = (option) => (dispatch, getState) => {
  const tag = option.value;

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_TAG', value: tag });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (tag !== getState().filters.tag) {
    return fetchResults(dispatch, getState, { action: 'CHANGE_TAG', tag, pageNumber: 1 }, onSuccess);
  }
};

export const changeVisibility = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_VISIBILITY', value });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(
      dispatch,
      getState,
      {
        action: 'CHANGE_VISIBILITY',
        visibility: value,
        pageNumber: 1
      },
      onSuccess
    );
  }
};

export const changeQ = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_Q', value });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(dispatch, getState, { action: 'CHANGE_Q', q: value, pageNumber: 1 }, onSuccess);
  }
};

export const clearAllFilters = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
    clearPage(dispatch);
    updateQueryString(dispatch, getState);
  };

  const initialState = { ...getUnfilteredState(), pageNumber: 1 };
  return fetchResults(dispatch, getState, { ...initialState, action: 'CLEAR_ALL_FILTERS' }, onSuccess);
};
