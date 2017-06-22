import { combineReducers } from 'redux';
import notifications from 'reducers/notifications';
import routing from 'reducers/routing';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import channels from 'reducers/channels';
import apiCalls from 'reducers/apiCalls';

export default combineReducers({
  flashMessage,
  routing,
  notifications,
  modal,
  channels,
  apiCalls
});
