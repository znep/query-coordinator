import { SET_FOURFOUR, ADD_LOCATION } from 'actions/routing';
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
    case ADD_LOCATION:
      if (state.length === 0) {
        return [action.location];
      } else if (state.length === 1) {
        return [...state, action.location];
      } else {
        return [state[state.length - 1], action.location];
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
