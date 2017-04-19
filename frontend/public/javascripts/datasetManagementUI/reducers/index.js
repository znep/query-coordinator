import { combineReducers } from 'redux';
import dbReducer from './database';
import notificationReducer from './notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';

const rootReducer = combineReducers({
  db: dbReducer,
  flashMessage,
  routing,
  notifications: notificationReducer,
  modal
});

export default rootReducer;
