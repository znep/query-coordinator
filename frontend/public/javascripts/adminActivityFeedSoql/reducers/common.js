import * as actions from '../actions';

const initialState = {
  filtersOpen: false
};

export default function table(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.common.types.TOGGLE_FILTERS:
      return Object.assign({}, state, { filtersOpen: !state.filtersOpen });

    default:
      return state;
  }
}
