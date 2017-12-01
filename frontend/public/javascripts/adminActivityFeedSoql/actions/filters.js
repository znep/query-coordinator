import * as paginationActions from './pagination';
import * as tableActions from './table';

const types = {
  CHANGE_TAB: 'CHANGE_TAB',
  CHANGE_EVENTS: 'CHANGE_EVENTS',
  CHANGE_ASSET_TYPE: 'CHANGE_ASSET_TYPE',
  CHANGE_EVENT: 'CHANGE_EVENT',
  CHANGE_DATE_RANGE: 'CHANGE_DATE_RANGE',
  CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS'
};

const reloadWithFilters = dispatch => {
  dispatch(paginationActions.resetPage());
  dispatch(paginationActions.fetchRowCount());
  return dispatch(tableActions.fetchData());
};

const changeTab = (tab) => (dispatch, getState) => {
  const state = getState();

  if (state.filters.activeTab === 'failure' && tab !== 'failure') {
    dispatch({ type: types.CHANGE_EVENT, event: null });
  }

  dispatch({ type: types.CHANGE_TAB, tab });

  return reloadWithFilters(dispatch);
};

const changeAssetType = (assetType) => (dispatch) => {
  dispatch({ type: types.CHANGE_ASSET_TYPE, assetType });
  return reloadWithFilters(dispatch);
};

const changeEventFilter = (event) => (dispatch) => {
  dispatch({ type: types.CHANGE_TAB, tab: 'all' });
  dispatch({ type: types.CHANGE_EVENT, event });
  return reloadWithFilters(dispatch);
};

const changeDateRange = (date) => (dispatch) => {
  dispatch({ type: types.CHANGE_DATE_RANGE, date });
  return reloadWithFilters(dispatch);
};

const clearAllFilters = () => (dispatch) => {
  dispatch({ type: types.CLEAR_ALL_FILTERS });
  return reloadWithFilters(dispatch);
};

export {
  types,
  changeTab,
  changeAssetType,
  changeEventFilter,
  changeDateRange,
  clearAllFilters
};
