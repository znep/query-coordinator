import * as ReduxImmutable from 'redux-immutablejs';
import bulkEdit from './bulkEdit';
import data from './data';
import quickEdit from './quickEdit';
import ui from './ui';

export default ReduxImmutable.combineReducers({
  bulkEdit,
  quickEdit,
  data,
  ui
});
