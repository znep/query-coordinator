import { combineReducers } from 'redux';
import notifications from 'reducers/notifications';
import flashMessage from 'reducers/flashMessage';
import modal from 'reducers/modal';
import apiCalls from 'reducers/apiCalls';
import history from 'reducers/history';
import forms from 'reducers/forms';

export default combineReducers({
  flashMessage,
  notifications,
  modal,
  apiCalls,
  forms,
  history
});
