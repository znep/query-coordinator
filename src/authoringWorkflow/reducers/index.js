import { combineReducers } from 'redux';
import vifAuthoring from './vifAuthoring';
import datasetMetadata from './datasetMetadata';

module.exports = combineReducers({
  vifAuthoring: vifAuthoring,
  datasetMetadata: datasetMetadata
});
