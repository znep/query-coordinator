import { combineReducers } from 'redux';

import assetActions from 'common/components/AssetBrowser/reducers/asset_actions';
import assetCounts from 'common/components/AssetBrowser/reducers/asset_counts';
import assetInventoryViewModel from 'common/components/AssetBrowser/reducers/asset_inventory_view_model';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import catalog from 'common/components/AssetBrowser/reducers/catalog';
import filters from 'common/components/AssetBrowser/reducers/filters';
import header from 'common/components/AssetBrowser/reducers/header';
import mobile from 'common/components/AssetBrowser/reducers/mobile';
import settings from 'common/components/AssetBrowser/reducers/settings';
import tabs from 'common/components/AssetBrowser/reducers/tabs';
import windowDimensions from 'common/components/AssetBrowser/reducers/window_dimensions';

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
  tabs,
  windowDimensions
});
