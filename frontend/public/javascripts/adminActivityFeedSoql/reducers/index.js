import { combineReducers } from 'redux';
import table from './table';
import pagination from './pagination';
import filters from './filters';
import windowDimensions from './windowDimensions';

export default combineReducers({
  table,
  pagination,
  filters,
  windowDimensions
});
