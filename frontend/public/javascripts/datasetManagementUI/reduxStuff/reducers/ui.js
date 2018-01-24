import { combineReducers } from 'redux';
import notifications from 'datasetManagementUI/reduxStuff/reducers/notifications';
import flashMessage from 'datasetManagementUI/reduxStuff/reducers/flashMessage';
import modal from 'datasetManagementUI/reduxStuff/reducers/modal';
import apiCalls from 'datasetManagementUI/reduxStuff/reducers/apiCalls';
import history from 'datasetManagementUI/reduxStuff/reducers/history';
import forms from 'datasetManagementUI/reduxStuff/reducers/forms';
import compiler from 'datasetManagementUI/reduxStuff/reducers/compiler';

export default combineReducers({
  flashMessage,
  notifications,
  modal,
  apiCalls,
  history,
  forms,
  compiler
});
