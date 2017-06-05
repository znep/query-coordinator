import { fetchResults } from './cetera';

export const toggleRecentlyViewed = () => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'TOGGLE_RECENTLY_VIEWED' });
  };

  return fetchResults(dispatch, getState, { onlyRecentlyViewed: !getState().filters.onlyRecentlyViewed },
    onSuccess);
};

export const changeLastUpdatedDate = (value) => (dispatch) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_LAST_UPDATED_DATE', value });
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

  // return fetchResults(dispatch, getState, { updatedAt }, onSuccess);
};

export const changeAssetType = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_ASSET_TYPE', value });
  };

  if (value !== getState().filters.assetTypes) {
    return fetchResults(dispatch, getState, { assetTypes: value }, onSuccess);
  }
};

export const changeAuthority = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_AUTHORITY', value });
  };

  if (value !== getState().filters.authority) {
    return fetchResults(dispatch, getState, { authority: value }, onSuccess);
  }
};

export const changeCategory = (option) => (dispatch, getState) => {
  const category = option.value;

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_CATEGORY', value: category });
  };

  if (category !== getState().filters.category) {
    return fetchResults(dispatch, getState, { category }, onSuccess);
  }
};

export const changeOwner = (option) => (dispatch, getState) => {
  const owner = { displayName: option.title, id: option.value };

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_OWNER', value: owner });
  };

  if (owner.id !== getState().filters.ownedBy.id) {
    return fetchResults(dispatch, getState, { ownedBy: owner }, onSuccess);
  }
};

export const changeTag = (option) => (dispatch, getState) => {
  const tag = option.value;

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_TAG', value: tag });
  };

  if (tag !== getState().filters.tag) {
    return fetchResults(dispatch, getState, { tag }, onSuccess);
  }
};

export const changeVisibility = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_VISIBILITY', value });
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(dispatch, getState, { visibility: value }, onSuccess);
  }
};
