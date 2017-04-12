import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import dbReducer from './database';
import notificationReducer from './notifications';
import fourfour from 'reducers/fourfour';
import flashMessage from 'reducers/flashMessage';
import readyToImport from 'reducers/readyToImport';

const rootReducer = combineReducers({
  db: dbReducer,
  fourfour,
  flashMessage,
  routing: routerReducer,
  notifications: notificationReducer,
  readyToImport
});

export default rootReducer;
