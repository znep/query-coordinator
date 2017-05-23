import { combineReducers } from 'redux';
import assetActions from './assetActions';
import catalog from './catalog';

export default combineReducers({
  assetActions,
  catalog
});
