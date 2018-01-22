import _ from 'lodash';
import I18n from 'common/i18n';
import {
  forEachSeries,
  removeSeries,
  setBooleanValueOrDeleteProperty,
  setDimensionGroupingColumnName,
  setMeasureAggregation,
  setMeasureColumn,
  setNumericValueOrDeleteProperty,
  setStringValueOrDefaultValue,
  setStringValueOrDeleteProperty,
  setUnits,
  trySetShowLegend,
  tryUnsetShowLegend
} from '../../helpers';
import { REFERENCE_LINES_DEFAULT_LINE_COLOR } from '../../constants';

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

    case actions.SET_ERROR_BARS_BAR_COLOR:
      forEachSeries(state, series => {
        _.set(series, 'errorBars.barColor', action.color);
      });
      break;

    case actions.SET_ERROR_BARS_LOWER_BOUND_COLUMN_NAME:
      setStringValueOrDeleteProperty(state, 'series[0].errorBars.lowerBoundColumnName', action.columnName);

      if (_.isNil(action.columnName) && _.isNil(_.get(state, 'series[0].errorBars.upperBoundColumnName'))) {
        _.unset(state, 'series[0].errorBars');
      }
      break;

    case actions.SET_ERROR_BARS_UPPER_BOUND_COLUMN_NAME:
      setStringValueOrDeleteProperty(state, 'series[0].errorBars.upperBoundColumnName', action.columnName);

      if (_.isNil(action.columnName) && _.isNil(_.get(state, 'series[0].errorBars.lowerBoundColumnName'))) {
        _.unset(state, 'series[0].errorBars');
      }
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

      const groupingDimension = _.get(state, 'series[0].dataSource.dimension.grouping.columnName');
      if (action.dimension && action.dimension === groupingDimension) {
        setDimensionGroupingColumnName(state, null);
      }
      break;

    case actions.REMOVE_SERIES:
      removeSeries(state, action);
      break;

    case actions.SET_MEASURE_AGGREGATION:
      setMeasureAggregation(state, action);
      break;

    case actions.SET_MEASURE_COLUMN:
      setMeasureColumn(state, action);
      break;

    case actions.SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;

    case actions.SET_PRECISION:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.precision', action.precision);
      });
      break;

    case actions.APPEND_REFERENCE_LINE:
      if (!state.referenceLines) {
        state.referenceLines = [];
      }

      state.referenceLines.push({
        color: REFERENCE_LINES_DEFAULT_LINE_COLOR,
        label: '',
        uId: _.uniqueId('reference-line-')
      });
      break;

    case actions.REMOVE_REFERENCE_LINE:
      state.referenceLines.splice(action.referenceLineIndex, 1);

      if (state.referenceLines.length == 0) {
        _.unset(state, 'referenceLines');
        tryUnsetShowLegend(state);
      }
      break;

    case actions.SET_REFERENCE_LINE_COLOR:
      if (action.referenceLineIndex < state.referenceLines.length) {
        const referenceLine = state.referenceLines[action.referenceLineIndex];
        _.set(referenceLine, 'color', action.color);
      }
      break;

    case actions.SET_REFERENCE_LINE_LABEL:
      if (action.referenceLineIndex < state.referenceLines.length) {
        const referenceLine = state.referenceLines[action.referenceLineIndex];
        _.set(referenceLine, 'label', action.label);

        if (_.isEmpty(action.label)) {
          tryUnsetShowLegend(state);
        } else {
          trySetShowLegend(state);
        }
      }
      break;

    case actions.SET_REFERENCE_LINE_VALUE:
      if (action.referenceLineIndex < state.referenceLines.length) {
        const referenceLine = state.referenceLines[action.referenceLineIndex];

        if (_.isFinite(action.value)) {
          _.set(referenceLine, 'value', action.value);
        } else {
          _.unset(referenceLine, 'value');
        }
      }
      break;

    case actions.SET_STACKED:
      forEachSeries(state, series => {
        if (action.stacked) {
          _.set(series, 'stacked.oneHundredPercent', action.oneHundredPercent);
        } else {
          _.unset(series, 'stacked');
        }
      });

      if (action.oneHundredPercent) {
        _.unset(state, 'configuration.measureAxisMinValue');
        _.unset(state, 'configuration.measureAxisMaxValue');
      }
      break;

    case actions.SET_TITLE:
      setStringValueOrDefaultValue(state, 'title', action.title, '');
      break;

    case actions.SET_DESCRIPTION:
      setStringValueOrDefaultValue(state, 'description', action.description, '');
      break;

    case actions.SET_SHOW_LEGEND:
      if (action.showLegend) {
        trySetShowLegend(state);
      } else {
        _.unset(state, 'configuration.showLegend');
      }
      break;

    case actions.SET_SHOW_LEGEND_OPENED:
      setBooleanValueOrDeleteProperty(state, 'configuration.showLegendOpened', action.showLegendOpened);
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
