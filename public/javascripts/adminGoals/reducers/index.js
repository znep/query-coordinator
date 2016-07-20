import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';

import goalTableData from './goalTableData';
import editMultipleItemsForm from './editMultipleItemsForm';
import notification from './notification';

export default combineReducers({
  notification,
  goalTableData,
  translations: (state, action) => state || Immutable.fromJS(window.translations || {}),
  editMultipleItemsForm
});
