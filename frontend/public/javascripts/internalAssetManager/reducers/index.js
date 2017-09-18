import { combineReducers } from 'redux';

import assetActions from './asset_actions';
import assetCounts from './asset_counts';
import assetInventoryViewModel from './asset_inventory_view_model';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import catalog from './catalog';
import filters from './filters';
import header from './header';
import mobile from './mobile';
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
  windowDimensions
});
