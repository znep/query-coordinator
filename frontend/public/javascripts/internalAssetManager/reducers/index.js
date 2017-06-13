import { combineReducers } from 'redux';
import assetActions from './assetActions';
import assetCounts from './asset_counts';
import catalog from './catalog';
import filters from './filters';

export default combineReducers({
  assetActions,
  assetCounts,
  catalog,
  filters
});
