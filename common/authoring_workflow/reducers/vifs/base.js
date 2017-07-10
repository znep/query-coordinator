import _ from 'lodash';
import {
  forEachSeries,
  setStringValueOrDefaultValue,
  setStringValueOrDeleteProperty,
  setNumericValueOrDeleteProperty,
  setUnits
} from '../../helpers';

import * as actions from '../../actions';

// This is a helper function that handles actions common to all vif types.
export default function(state, action) {
  switch (action.type) {
    case actions.RECEIVE_METADATA:
      forEachSeries(state, series => {
        setUnits(series, action);
      });
      break;

    case actions.SET_DOMAIN:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.domain', action.domain, null);
      });
      break;

    case actions.SET_DATASET_UID:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.datasetUid', action.datasetUid, null);
      });
      break;

    case actions.SET_FILTERS:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.filters', action.filters);
      });
      break;

    case actions.SET_DIMENSION:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.dimension.columnName', action.dimension, null);
      });
      break;

    case actions.INITIALIZE_SERIES:
      for (var i = 0; i < action.seriesCount - 1; i++) {
        const series = _.cloneDeep(state.series[0]);
        state.series.push(series);
      }
      break;

    case actions.APPEND_SERIES_WITH_MEASURE: {
        const series = _.cloneDeep(state.series[0]);
        series.dataSource.measure.columnName = action.measure.columnName;

        if (_.isNull(action.measure.columnName)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else if (series.dataSource.measure.aggregationFunction === 'count') {
          series.dataSource.measure.aggregationFunction = 'sum';
        }

        state.series.push(series);
      }
      break;

    case actions.REMOVE_SERIES:
      state.series.splice(action.seriesIndex, 1);
      break;

    case actions.SET_MEASURE:

      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];

        _.set(series, 'dataSource.measure.columnName', action.columnName);
        _.set(series, 'dataSource.measure.label', action.label);

        if (_.isNull(action.columnName)) {
          _.set(series, 'dataSource.measure.aggregationFunction', 'count');
        } else if (series.dataSource.measure.aggregationFunction === 'count') {
          _.set(series, 'dataSource.measure.aggregationFunction', 'sum');
        }
      }
      break;

    case actions.SET_MEASURE_AGGREGATION:
      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];
        _.set(series, 'dataSource.measure.aggregationFunction', action.aggregationFunction);
      }
      break;

    case actions.SET_TITLE:
      setStringValueOrDefaultValue(state, 'title', action.title, '');
      break;

    case actions.SET_DESCRIPTION:
      setStringValueOrDefaultValue(state, 'description', action.description, '');
      break;

    case actions.SET_SHOW_LEGEND:
      _.set(state, 'configuration.showLegend', action.showLegend);
      break;

    case actions.SET_VIEW_SOURCE_DATA_LINK:
      _.set(state, 'configuration.viewSourceDataLink', action.viewSourceDataLink);
      break;

    case actions.SET_UNIT_ONE:
      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];
        _.set(series, 'unit.one', action.one);
      }
      break;

    case actions.SET_UNIT_OTHER:
      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];
        _.set(series, 'unit.other', action.other);
      }
      break;

    case actions.SET_PRIMARY_COLOR:
      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];
        setStringValueOrDeleteProperty(series, 'color.primary', action.primaryColor);
      }
      break;

    case actions.SET_SECONDARY_COLOR:
      if (action.seriesIndex < state.series.length) {
        const series = state.series[action.seriesIndex];
        setStringValueOrDeleteProperty(series, 'color.secondary', action.secondaryColor);
      }
      break;

    case actions.SET_LABEL_TOP:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.top', action.labelTop);
      break;

    case actions.SET_LABEL_BOTTOM:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.bottom', action.labelBottom);
      break;

    case actions.SET_LABEL_LEFT:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.left', action.labelLeft);
      break;

    case actions.SET_LABEL_RIGHT:
      setStringValueOrDeleteProperty(state, 'configuration.axisLabels.right', action.labelRight);
      break;

    case actions.SET_X_AXIS_SCALING_MODE:
      setStringValueOrDeleteProperty(state, 'configuration.xAxisScalingMode', action.xAxisScalingMode);
      break;

    case actions.SET_MEASURE_AXIS_MIN_VALUE:
      setNumericValueOrDeleteProperty(state, 'configuration.measureAxisMinValue', action.measureAxisMinValue);
      break;

    case actions.SET_MEASURE_AXIS_MAX_VALUE:
      setNumericValueOrDeleteProperty(state, 'configuration.measureAxisMaxValue', action.measureAxisMaxValue);
      break;
  }

  return state;
}
