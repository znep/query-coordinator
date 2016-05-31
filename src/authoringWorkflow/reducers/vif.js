import _ from 'lodash';

import {
  RECEIVE_DATASET_METADATA,
  HANDLE_DATASET_METADATA_ERROR,
  SET_DIMENSION,
  SET_MEASURE,
  SET_CHART_TYPE,
  SET_TITLE,
  SET_DESCRIPTION
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

    case SET_MEASURE:
      _.each(state.series, function(series) {
        series.dataSource.measure.columnName = action.measure;
      });
      break;

    case SET_CHART_TYPE:
      _.each(state.series, function(series) {
        series.type = action.chartType;
      });
      break;

    case SET_TITLE:
      state.title = action.title;
      break;

    case SET_DESCRIPTION:
      state.description = action.description;
      break;
  }

  return state;
}
