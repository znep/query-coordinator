import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import dbReducer from './database';

const rootReducer = combineReducers({
  db: dbReducer,
  routing: routerReducer
});

export default rootReducer;
