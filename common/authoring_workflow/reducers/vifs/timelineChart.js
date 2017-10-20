import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  isGroupingOrMultiSeries,
  setBooleanValueOrDeleteProperty,
  setDimensionGroupingColumnName,
  setStringValueOrDeleteProperty
} from '../../helpers';

import * as actions from '../../actions';

export default function timelineChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().timelineChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {

    case actions.RESET_STATE:
      state = vifs().timelineChart;
      break;

    case actions.SET_DIMENSION_GROUPING_COLUMN_NAME:
      setDimensionGroupingColumnName(state, action.dimensionGroupingColumnName);
      break;

    case actions.SET_CUSTOM_COLOR_PALETTE:
      const customColorPalette = action.customColorPalette;
      const grouping = action.dimensionGroupingColumnName;
      _.set(state, 'series[0].color.customPalette', {
        [grouping]: customColorPalette
      });
      break;

    case actions.UPDATE_CUSTOM_COLOR_PALETTE: {
      const { dimensionGroupingColumnName, group, selectedColor } = action;
      const path = ['series', 0, 'color', 'customPalette', dimensionGroupingColumnName, group, 'color'];
      _.set(state, path, selectedColor)
      break;
    }


    case actions.SET_TREAT_NULL_VALUES_AS_ZERO:
      setBooleanValueOrDeleteProperty(state, 'configuration.treatNullValuesAsZero', action.treatNullValuesAsZero);
      break;

    case actions.SET_COLOR_PALETTE:
      if (isGroupingOrMultiSeries(state)) {
        forEachSeries(state, series => {
          setStringValueOrDeleteProperty(series, 'color.palette', action.colorPalette);
        });
      }
      break;

    case actions.SET_PRECISION:
      const xAxisScalingMode = (action.precision === 'none') ? 'pan' : 'fit';
      _.set(state, 'configuration.xAxisScalingMode', xAxisScalingMode);
      
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', { parameter: 'dimension', sort: 'asc' });
        _.set(series, 'dataSource.precision', action.precision);
      });
      break;

    case actions.APPEND_REFERENCE_LINE:
    case actions.APPEND_SERIES:
    case actions.RECEIVE_METADATA:
    case actions.REMOVE_REFERENCE_LINE:
    case actions.REMOVE_SERIES:
    case actions.SET_DATASET_UID:
    case actions.SET_DESCRIPTION:
    case actions.SET_DIMENSION:
    case actions.SET_DOMAIN:
    case actions.SET_FILTERS:
    case actions.SET_LABEL_BOTTOM:
    case actions.SET_LABEL_LEFT:
    case actions.SET_MEASURE:
    case actions.SET_MEASURE_AGGREGATION:
    case actions.SET_MEASURE_AXIS_MAX_VALUE:
    case actions.SET_MEASURE_AXIS_MIN_VALUE:
    case actions.SET_ORDER_BY:
    case actions.SET_PRIMARY_COLOR:
    case actions.SET_REFERENCE_LINE_COLOR:
    case actions.SET_REFERENCE_LINE_LABEL:
    case actions.SET_REFERENCE_LINE_VALUE:
    case actions.SET_SHOW_LEGEND:
    case actions.SET_TITLE:
    case actions.SET_UNIT_ONE:
    case actions.SET_UNIT_OTHER:
    case actions.SET_VIEW_SOURCE_DATA_LINK:
    case actions.SET_X_AXIS_SCALING_MODE:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
