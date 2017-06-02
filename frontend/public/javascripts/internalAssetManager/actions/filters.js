import { fetchResults } from './cetera';

// TODO: make this actually work
export const toggleRecentlyViewed = () => (
  { type: 'TOGGLE_RECENTLY_VIEWED' }
);

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

export const changeVisibility = (value) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_VISIBILITY', value });
  };

  if (value !== getState().filters.visibility) {
    return fetchResults(dispatch, getState, { visibility: value }, onSuccess);
  }
};
