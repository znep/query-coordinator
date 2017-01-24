import { combineReducers } from 'redux';

import externalResource from './externalResource';
import modal from './modal';
import pageResults from './pageResults';
import resultCount from './resultCount';

export default combineReducers({
  externalResource,
  modal,
  pageResults,
  resultCount
});
