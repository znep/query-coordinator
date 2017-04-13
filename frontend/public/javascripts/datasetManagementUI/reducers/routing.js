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

const routing = combineReducers({
  fourfour,
  location: routerReducer
});

export default routing;
