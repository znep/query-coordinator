import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';

import goalTableData from './goalTableData';
import editMultipleItemsForm from './editMultipleItemsForm';
import quickEditForm from './quickEditForm';
import notification from './notification';
import dataExport from './dataExport';

export default combineReducers({
  notification,
  goalTableData,
  translations: state => state || Immutable.fromJS(window.translations || {}),
  editMultipleItemsForm,
  quickEditForm,
  dataExport
});
