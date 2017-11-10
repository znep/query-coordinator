import * as api from '../lib/api';
import * as commonActions from './common';

const types = {
  FETCH_DATA: 'FETCH_DATA',
  STORE_DATA: 'STORE_DATA'
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
    filters: state.filters
  };

  return api.
    fetchTable(options).
    then((data) => {

      dispatch(storeData(data));
    }).
    catch(commonActions.apiException);
};

export {
  types,
  fetchData,
  storeData
};
