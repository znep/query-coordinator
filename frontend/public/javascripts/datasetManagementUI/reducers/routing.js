import { SET_FOURFOUR } from 'actions/routing';
import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

const fourfour = (state = '', action) => {
  switch (action.type) {
    case SET_FOURFOUR:
      return action.fourfour;
    default:
      return state;
  }
};

const history = (state = [], action) => {
  switch (action.type) {
    case 'PUSH_URL':
      if (state.length === 0) {
        return [action.pathname];
      } else if (state.length === 1) {
        return [...state, action.pathname];
      } else {
        return [state[state.length - 1], action.pathname];
      }
    default:
      return state;
  }
};

const routing = combineReducers({
  fourfour,
  history,
  location: routerReducer
});

export default routing;
