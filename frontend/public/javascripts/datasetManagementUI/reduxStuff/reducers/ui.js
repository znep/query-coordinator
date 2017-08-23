import { combineReducers } from 'redux';
import notifications from 'reduxStuff/reducers/notifications';
import flashMessage from 'reduxStuff/reducers/flashMessage';
import modal from 'reduxStuff/reducers/modal';
import apiCalls from 'reduxStuff/reducers/apiCalls';
import history from 'reduxStuff/reducers/history';
import forms from 'reduxStuff/reducers/forms';

export default combineReducers({
  flashMessage,
  notifications,
  modal,
  apiCalls,
  history,
  forms
});
