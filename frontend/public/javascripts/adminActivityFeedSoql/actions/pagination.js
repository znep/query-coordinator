import * as api from '../lib/api';
import * as commonActions from './common';

const types = {
  STORE_ROW_COUNT: 'STORE_ROW_COUNT'
};

const storeRowCount = (rowCount) => ({
  type: types.STORE_ROW_COUNT,
  rowCount
});

const fetchRowCount = () => (dispatch) => {
  return api.
    fetchRowCount().
    then((rowCount) => {
      dispatch(storeRowCount(rowCount));
    }).
    catch(commonActions.apiException);
};

export {
  types,
  fetchRowCount,
  storeRowCount
};
