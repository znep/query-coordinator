import * as actions from '../actions';

const initialState = {
  column: 'created_at',
  direction: 'desc'
};

export default function order(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.order.types.CHANGE_ORDER:
      return Object.assign({}, state,
        { column: action.column, direction: action.direction });

    default:
      return state;
  }
}
