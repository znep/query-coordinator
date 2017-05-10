import { SET_FOURFOUR, ADD_LOCATION, SET_OUTPUT_SCHEMA_ID } from 'actions/routing';
import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

// TODO: refactor into general urlparams reducer
const fourfour = (state = '', action) => {
  switch (action.type) {
    case SET_FOURFOUR:
      return action.fourfour;
    default:
      return state;
  }
};

const outputSchemaId = (state = null, action) => {
  switch (action.type) {
    case SET_OUTPUT_SCHEMA_ID:
      return action.id;
    default:
      return state;
  }
};

const history = (state = [], action) => {
  switch (action.type) {
    case ADD_LOCATION:
      return [...state, action.location];
    default:
      return state;
  }
};

const routing = combineReducers({
  fourfour,
  outputSchemaId,
  history,
  location: routerReducer
});

export default routing;
