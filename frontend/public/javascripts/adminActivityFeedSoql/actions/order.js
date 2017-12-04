import _ from 'lodash';
import * as paginationActions from './pagination';
import * as tableActions from './table';

const types = {
  CHANGE_ORDER: 'CHANGE_ORDER'
};

const changeOrder = (column) => (dispatch, getState) => {
  const state = getState();
  const direction = (_.get(state, 'order.column') === column &&
    (state.order.direction === 'asc' ? 'desc' : 'asc')) || 'asc';

  dispatch({ type: types.CHANGE_ORDER, column, direction });
  dispatch(paginationActions.resetPage());
  dispatch(paginationActions.fetchRowCount());
  return dispatch(tableActions.fetchData());
};

export {
  types,
  changeOrder
};
