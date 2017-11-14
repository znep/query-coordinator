import * as actions from '../actions';

const initialState = {
  activeTab: 'all'
};

export default function filters(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  switch (action.type) {
    case actions.filters.types.CHANGE_TAB:
      return Object.assign({}, state, { activeTab: action.tab });

    default:
      return state;
  }
}
