import { combineReducers } from 'redux';
import table from './table';
import pagination from './pagination';

export default combineReducers({
  table,
  pagination
});
