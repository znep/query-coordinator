import { combineReducers } from 'redux';

import metadata from './metadata';
import data from './data';

export default combineReducers({
  metadata,
  data
});
