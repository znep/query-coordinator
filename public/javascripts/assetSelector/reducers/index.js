import { combineReducers } from 'redux';

import modal from './modal';
import pageResults from './pageResults';
import resultCount from './resultCount';

export default combineReducers({
  modal,
  pageResults,
  resultCount
});
