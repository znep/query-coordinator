import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import dbReducer from './database';
import notificationReducer from './notifications';
import fourfour from 'reducers/fourfour';

const rootReducer = combineReducers({
  db: dbReducer,
  fourfour,
  routing: routerReducer,
  notifications: notificationReducer
});

export default rootReducer;
