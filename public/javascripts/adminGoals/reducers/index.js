import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';

import goalTableData from './goalTableData';
import editMultipleItemsForm from './editMultipleItemsForm';

export default combineReducers({
  goalTableData,
  translations: (state, action) => state || Immutable.fromJS(window.translations),
  editMultipleItemsForm
});
