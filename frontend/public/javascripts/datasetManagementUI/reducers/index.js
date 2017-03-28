import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import dbReducer from './database';
import notificationReducer from './notifications';
import displayStateReducer from './displayState';

const rootReducer = combineReducers({
  db: dbReducer,
  routing: routerReducer,
  notifications: notificationReducer,
  displayState: displayStateReducer
});

export default rootReducer;
