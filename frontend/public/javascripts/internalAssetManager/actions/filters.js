import { fetchResults } from './cetera';
import { clearPage } from './pager';
import { getInitialState } from '../reducers/filters';

export const toggleRecentlyViewed = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'TOGGLE_RECENTLY_VIEWED' });
    clearPage(dispatch);
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

export const changeLastUpdatedDate = (value) => (dispatch) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_LAST_UPDATED_DATE', value });
    clearPage(dispatch);
  };

  /*
    Cetera doesn't currently allow filtering on lastUpdatedDate, only sorting. We still need to figure out
    what we're going to do with this, but it will likely be removed.
  */
  onSuccess();

  // Map relative value to a timestamp for cetera
  // let updatedAt;

  // if (value === 'past3Days') {
  //   updatedAt = moment().subtract(3, 'days').format();
  // } else if (value === 'pastWeek') {
  //   updatedAt = moment().subtract(1, 'week').format();
  // } else if (value === 'pastMonth') {
  //   updatedAt = moment().subtract(1, 'month').format();
  // } else if (value === 'past3Months') {
  //   updatedAt = moment().subtract(3, 'months').format();
  // } else if (value === 'past6Months') {
  //   updatedAt = moment().subtract(6, 'months').format();
  // } else if (value === 'customDateRange') {
  //   updatedAt = null; // TODO
  // }

  // return fetchResults(dispatch, getState, { action: 'CHANGE_LAST_UPDATED_DATE', updatedAt }, onSuccess);
};

export const changeAssetType = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_ASSET_TYPE', value });
    clearPage(dispatch);
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
  };

  if (tag !== getState().filters.tag) {
    return fetchResults(dispatch, getState, { action: 'CHANGE_TAG', tag, pageNumber: 1 }, onSuccess);
  }
};

export const changeVisibility = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_VISIBILITY', value });
    clearPage(dispatch);
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
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(dispatch, getState, { action: 'CHANGE_Q', q: value, pageNumber: 1 }, onSuccess);
  }
};

export const clearAllFilters = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
    clearPage(dispatch);
  };

  const initialState = { ...getInitialState(), pageNumber: 1 };
  return fetchResults(dispatch, getState, { ...initialState, action: 'CLEAR_ALL_FILTERS' }, onSuccess);
};
