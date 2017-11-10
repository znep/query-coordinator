import * as actions from '../actions';

const initialState = {
  data: []
};

export default function table(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.table.types.STORE_DATA:
      return Object.assign({}, state, { data: action.data });

    default:
      return state;
  }
}
