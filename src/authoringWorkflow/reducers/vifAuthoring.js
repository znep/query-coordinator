import _ from 'lodash';

import vifs from '../vifs';
import {
  RECEIVE_DATASET_METADATA,
  HANDLE_DATASET_METADATA_ERROR,
  SET_DIMENSION,
  SET_MEASURE,
  SET_CHART_TYPE,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  SET_HIGHLIGHT_COLOR
} from '../actions';

export default function vifAuthoring(state, action) {
  if (_.isUndefined(state)) {
    return {
      selectedVisualizationType: 'columnChart',
      vifs: vifs()
    };
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RECEIVE_DATASET_METADATA:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, (series) => {
          series.dataSource.datasetUid = action.datasetMetadata.id;
        });
      });
      break;

    case HANDLE_DATASET_METADATA_ERROR:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, (series) => {
          series.dataSource.datasetUid = null;
        });
      });
      break;

    case SET_DIMENSION:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, (series) => {
          series.dataSource.dimension.columnName = action.dimension;
        });
      });
      break;

    case SET_MEASURE:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, function(series) {
          series.dataSource.measure.columnName = action.measure;
        });
      });
      break;

    case SET_CHART_TYPE:
      debugger
      state.selectedVisualizationType = action.chartType;
      break;

    case SET_TITLE:
      _.each(state.vifs, (vif) => {
        vif.title = action.title;
      });
      break;

    case SET_DESCRIPTION:
      _.each(state.vifs, (vif) => {
        vif.description = action.description;
      });
      break;

    case SET_PRIMARY_COLOR:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, function(series) {
          _.set(series, 'color.primary', action.primaryColor);
        });
      });
      break;

    case SET_SECONDARY_COLOR:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, function(series) {
          _.set(series, 'color.secondary', action.secondaryColor);
        });
      });
      break;

    case SET_HIGHLIGHT_COLOR:
      _.each(state.vifs, (vif) => {
        _.each(vif.series, function(series) {
          _.set(series, 'color.highlight', action.highlightColor);
        });
      });
      break;
  }

  return state;
}
