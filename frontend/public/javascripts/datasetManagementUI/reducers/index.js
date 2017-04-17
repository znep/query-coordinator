import { combineReducers } from 'redux';
import dbReducer from './database';
import notificationReducer from './notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import readyToImport from 'reducers/readyToImport';
import modal from 'reducers/modal';

const rootReducer = combineReducers({
  db: dbReducer,
  flashMessage,
  routing,
  notifications: notificationReducer,
  readyToImport,
  modal
});

export default rootReducer;
