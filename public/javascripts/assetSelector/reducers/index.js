import { combineReducers } from 'redux';

import pageResults from './pageResults';
import viewType from './viewType';

export default combineReducers({
  pageResults,
  viewType
});
