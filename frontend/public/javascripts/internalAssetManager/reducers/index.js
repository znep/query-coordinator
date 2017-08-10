import { combineReducers } from 'redux';
import assetActions from './asset_actions';
import assetCounts from './asset_counts';
import catalog from './catalog';
import filters from './filters';
import header from './header';

export default combineReducers({
  assetActions,
  assetCounts,
  catalog,
  filters,
  header
});
