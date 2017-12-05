import * as api from '../lib/api';
import * as commonActions from './common';

const types = {
  FETCH_DATA: 'FETCH_DATA',
  STORE_DATA: 'STORE_DATA',
  SHOW_DETAILS: 'SHOW_DETAILS',
  HIDE_DETAILS: 'HIDE_DETAILS'
};

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

  return api.
    fetchTable(options).
    then((data) => {

      return dispatch(storeData(data));
    }).
    catch(commonActions.apiException);
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
  hideDetails
};
