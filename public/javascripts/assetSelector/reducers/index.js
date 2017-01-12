import { combineReducers } from 'redux';

import pageResults from './pageResults';
import resultCount from './resultCount';

export default combineReducers({
  pageResults,
  resultCount
});
