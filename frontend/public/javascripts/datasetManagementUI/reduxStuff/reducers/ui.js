import { combineReducers } from 'redux';
import notifications from 'reduxStuff/reducers/notifications';
import flashMessage from 'reduxStuff/reducers/flashMessage';
import modal from 'reduxStuff/reducers/modal';
import apiCalls from 'reduxStuff/reducers/apiCalls';
import history from 'reduxStuff/reducers/history';

export default combineReducers({
  flashMessage,
  notifications,
  modal,
  apiCalls,
  history
});
