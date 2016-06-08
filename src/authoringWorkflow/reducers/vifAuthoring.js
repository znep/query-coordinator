import _ from 'lodash';

import vifs from '../vifs';
import {
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR,
  SET_DIMENSION,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_CHART_TYPE,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  SET_HIGHLIGHT_COLOR,
  SET_COMPUTED_COLUMN
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
    case RECEIVE_METADATA:
      forEachSeries(state, series => {
        series.dataSource.datasetUid = action.datasetMetadata.id;
      });
      break;

    case HANDLE_METADATA_ERROR:
      forEachSeries(state, series => {
        series.dataSource.datasetUid = null;
      });
      break;

    case SET_DIMENSION:
      forEachSeries(state, series => {
        series.dataSource.dimension.columnName = action.dimension;
      });
      break;

    case SET_MEASURE:
      forEachSeries(state, series => {
        series.dataSource.measure.columnName = action.measure;
      });
      break;

    case SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
      break;

    case SET_CHART_TYPE:
      state.selectedVisualizationType = action.chartType;
      break;

    case SET_TITLE:
      _.each(state.vifs, vif => {
        vif.title = action.title;
      });
      break;

    case SET_DESCRIPTION:
      _.each(state.vifs, vif => {
        vif.description = action.description;
      });
      break;

    case SET_PRIMARY_COLOR:
      forEachSeries(state, series => {
        _.set(series, 'color.primary', action.primaryColor);
      });
      break;

    case SET_SECONDARY_COLOR:
      forEachSeries(state, series => {
        _.set(series, 'color.secondary', action.secondaryColor);
      });
      break;

    case SET_HIGHLIGHT_COLOR:
      forEachSeries(state, series => {
        _.set(series, 'color.highlight', action.highlightColor);
      });
      break;

    case SET_COMPUTED_COLUMN:
      _.set(state.vifs, 'choroplethMap.configuration.computedColumnName', action.computedColumnName);
      _.set(state.vifs, 'choroplethMap.configuration.shapefile.uid', action.computedColumnUid);
      break;
  }

  return state;
}

const forEachSeries = (state, callback) => {
  _.each(state.vifs, vif => {
    _.each(vif.series, series => {
      callback(series, vif);
    });
  });
};
