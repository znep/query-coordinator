import * as api from '../lib/api';

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
    limit: state.pagination.pageSize
  };

  return api.
    fetchTable(options).
    then((data) => {

      dispatch(storeData(data));
    });
};

export {
  types,
  fetchData,
  storeData
};
