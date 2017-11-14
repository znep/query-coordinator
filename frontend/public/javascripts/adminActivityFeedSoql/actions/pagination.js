import * as api from '../lib/api';
import * as commonActions from './common';
import * as tableActions from './table';

const types = {
  STORE_ROW_COUNT: 'STORE_ROW_COUNT',
  STORE_PAGE: 'STORE_PAGE',
  RESET_PAGE: 'RESET_PAGE'
};

const storeRowCount = (rowCount) => ({
  type: types.STORE_ROW_COUNT,
  rowCount
});

const fetchRowCount = () => (dispatch, getState) => {
  const state = getState();

  const options = {
    filters: state.filters
  };

  return api.
    fetchRowCount(options).
    then((rowCount) => {
      dispatch(storeRowCount(parseInt(rowCount, 10)));
    }).
    catch(commonActions.apiException);
};

const storePage = (page) => ({
  type: types.STORE_PAGE,
  page
});

const changePage = (page) => (dispatch) => {
  dispatch(storePage(page));
  dispatch(tableActions.fetchData());
};

const resetPage = () => ({
  type: types.RESET_PAGE
});

export {
  types,
  fetchRowCount,
  storeRowCount,
  changePage,
  storePage,
  resetPage
};
