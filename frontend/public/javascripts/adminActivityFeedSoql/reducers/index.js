import { combineReducers } from 'redux';
import table from './table';
import pagination from './pagination';
import filters from './filters';
import windowDimensions from './windowDimensions';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import common from './common';
import order from './order';

export default combineReducers({
  table,
  pagination,
  filters,
  windowDimensions,
  autocomplete,
  common,
  order
});
