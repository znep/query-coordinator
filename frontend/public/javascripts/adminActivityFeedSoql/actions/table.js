import * as api from '../lib/api';

const types = {
  FETCH_DATA: 'FETCH_DATA',
  STORE_DATA: 'STORE_DATA',
  SHOW_DETAILS: 'SHOW_DETAILS',
  HIDE_DETAILS: 'HIDE_DETAILS',
  FETCHING_TABLE: 'FETCHING_TABLE',
  FETCH_TABLE_SUCCESS: 'FETCH_TABLE_SUCCESS',
  FETCH_TABLE_ERROR: 'FETCH_TABLE_ERROR'
};

const fetchingTable = () => ({
  type: types.FETCHING_TABLE
});

const fetchingTableSuccess = () => ({
  type: types.FETCH_TABLE_SUCCESS
});

const fetchingTableError = (errMsg = null) => ({
  type: types.FETCH_TABLE_ERROR, details: errMsg
});

const storeData = (data) => ({
  type: types.STORE_DATA,
  data
});

const fetchData = () => (dispatch, getState) => {
  const state = getState();

  const options = {
    offset: (state.pagination.page - 1) * state.pagination.pageSize,
    limit: state.pagination.pageSize,
    filters: state.filters,
    order: state.order
  };

  dispatch(fetchingTable());

  return api.
    fetchTable(options).
    then((data) => dispatch(storeData(data))).
    then(() => dispatch(fetchingTableSuccess())).
    catch((error) => dispatch(fetchingTableError(error)));
};

const showDetails = (id) => ({
  type: types.SHOW_DETAILS,
  id
});

const hideDetails = () => ({
  type: types.HIDE_DETAILS
});

export {
  types,
  fetchData,
  storeData,
  showDetails,
  hideDetails,
  fetchingTable,
  fetchingTableSuccess,
  fetchingTableError
};
