import _ from 'lodash';

import {
  RECEIVE_DATASET_METADATA,
  HANDLE_DATASET_METADATA_ERROR,
  SET_DIMENSION
} from '../actions';

import defaultVif from '../defaultVif';

export default function vif(state, action) {
  if (_.isUndefined(state)) {
    return _.cloneDeep(defaultVif);
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RECEIVE_DATASET_METADATA:
      _.each(state.series, function(series) {
        series.dataSource.datasetUid = action.datasetMetadata.id;
      });
      break;

    case HANDLE_DATASET_METADATA_ERROR:
      _.each(state.series, function(series) {
        series.dataSource.datasetUid = null;
      });
      break;

    case SET_DIMENSION:
      _.each(state.series, function(series) {
        series.dataSource.dimension.columnName = action.dimension;
      });
      break;
  }

  return state;
}
