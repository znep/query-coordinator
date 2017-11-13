import * as actions from '../actions';
import { DEFAULT_PAGE_SIZE } from '../constants';

const initialState = {
  pageSize: DEFAULT_PAGE_SIZE,
  page: 1,
  rowCount: 0
};

export default function table(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.pagination.types.STORE_ROW_COUNT:
      return Object.assign({}, state, { rowCount: action.rowCount });

    case actions.pagination.types.STORE_PAGE:
      return Object.assign({}, state, { page: action.page });

    default:
      return state;
  }
}
