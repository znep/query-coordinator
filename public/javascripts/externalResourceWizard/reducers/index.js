import { combineReducers } from 'redux';

import content from './content';
import modal from './modal';

export default combineReducers({
  content,
  modal
});
