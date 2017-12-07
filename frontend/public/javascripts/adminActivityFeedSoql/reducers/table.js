import * as actions from '../actions';

const initialState = {
  data: [],
  openDetailsId: null,
  fetchingTable: false,
  fetchTableError: null
};

export default function table(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.table.types.STORE_DATA:
      return Object.assign({}, state, { data: action.data });

    case actions.table.types.SHOW_DETAILS:
      return Object.assign({}, state, { openDetailsId: action.id });

    case actions.table.types.HIDE_DETAILS:
      return Object.assign({}, state, { openDetailsId: null });

    case actions.table.types.FETCHING_TABLE:
      return Object.assign({}, state, { fetchingTable: true });

    case actions.table.types.FETCH_TABLE_SUCCESS:
      return Object.assign({}, state, { fetchingTable: false });

    case actions.table.types.FETCH_TABLE_ERROR:
      return Object.assign({}, state, {
        fetchingTable: false,
        fetchTableError: action.details || true
      });

    default:
      return state;
  }
}
