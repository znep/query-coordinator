import { combineReducers } from 'redux';
import db from './database';
import notifications from './notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import channels from 'reducers/channels';
import apiCalls from 'reducers/apiCalls';

const rootReducer = combineReducers({
  db,
  flashMessage,
  routing,
  notifications,
  modal,
  channels,
  apiCalls
});

export default rootReducer;
