import { combineReducers } from 'redux';
import assetActions from './assetActions';
import catalog from './catalog';
import filters from './filters';

export default combineReducers({
  assetActions,
  catalog,
  filters
});
