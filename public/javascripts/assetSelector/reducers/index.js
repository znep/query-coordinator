import { combineReducers } from 'redux';

import pageResults from './pageResults';
import resultCount from './resultCount';
import viewType from './viewType';

export default combineReducers({
  pageResults,
  resultCount,
  viewType
});
