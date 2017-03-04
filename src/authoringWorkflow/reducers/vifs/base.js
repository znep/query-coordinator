import { translate } from '../../../I18n';

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

    case actions.SET_MEASURE:
      forEachSeries(state, series => {
        var aggregationFunction = series.dataSource.measure.aggregationFunction;

        series.dataSource.measure.columnName = action.measure;

        if (_.isNull(action.measure)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else if (aggregationFunction === 'count') {
          series.dataSource.measure.aggregationFunction = 'sum';
        }
      });
      break;

    case actions.SET_TITLE:
      setStringValueOrDefaultValue(state, 'title', action.title, null);
      break;

    case actions.SET_DESCRIPTION:
      setStringValueOrDefaultValue(state, 'description', action.description, null);
      break;

    case actions.SET_VIEW_SOURCE_DATA_LINK:
      _.set(state, 'configuration.viewSourceDataLink', action.viewSourceDataLink);
      break;

    case actions.SET_UNIT_ONE:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.unit.one'));
      });
      break;

    case actions.SET_UNIT_OTHER:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.unit.other'));
      });
      break;

    case actions.SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
      break;

    case actions.SET_PRIMARY_COLOR:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.primary', action.primaryColor);
      });
      break;

    case actions.SET_SECONDARY_COLOR:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.secondary', action.secondaryColor);
      });
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

    case actions.SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
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