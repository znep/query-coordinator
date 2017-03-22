import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import dbReducer from './database';
import notificationReducer from './notifications';

const rootReducer = combineReducers({
  db: dbReducer,
  routing: routerReducer,
  notifications: notificationReducer
});

export default rootReducer;
