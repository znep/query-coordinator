import { combineReducers } from 'redux';
import vif from './vif';
import datasetMetadata from './datasetMetadata';

module.exports = combineReducers({
  vif: vif,
  datasetMetadata: datasetMetadata
});
