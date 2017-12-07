import * as actions from '../actions';

const initialState = {
  data: [],
  openDetailsId: null
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

    default:
      return state;
  }
}
