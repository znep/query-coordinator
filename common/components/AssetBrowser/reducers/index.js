import { combineReducers } from 'redux';

import assetActions from 'common/components/AssetBrowser/reducers/asset_actions';
import assetCounts from 'common/components/AssetBrowser/reducers/asset_counts';
import assetInventoryViewModel from 'common/components/AssetBrowser/reducers/asset_inventory_view_model';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import catalog from './catalog';
import filters from './filters';
import header from './header';
import mobile from './mobile';
import settings from './settings';
import windowDimensions from './window_dimensions';

export default combineReducers({
  assetActions,
  assetCounts,
  assetInventoryViewModel,
  autocomplete,
  catalog,
  filters,
  header,
  mobile,
  settings,
  windowDimensions
});
