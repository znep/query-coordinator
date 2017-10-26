import _ from 'lodash';
import * as actions from '../../actions';
import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  isGroupingOrMultiSeries,
  setBooleanValueOrDefaultValue,
  setBooleanValueOrDeleteProperty,
  setStringValueOrDeleteProperty,
  setDimensionGroupingColumnName
} from '../../helpers';

export default function columnChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().columnChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {

    case actions.RESET_STATE:
      state = vifs().columnChart;
      break;

    case actions.SET_SHOW_DIMENSION_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showDimensionLabels', action.showDimensionLabels, true);
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
      _.set(state, path, selectedColor);
      break;
    }

    case actions.SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);

      forEachSeries(state, series => {
        _.unset(series, 'dataSource.limit');
      });
      break;

    case actions.SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);

      forEachSeries(state, series => {
        _.set(series, 'dataSource.limit', parseInt(action.limitCount, 10));
      });
      break;

    case actions.SET_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);
      break;

    case actions.SET_COLOR_PALETTE:
      if (isGroupingOrMultiSeries(state)) {
        forEachSeries(state, series => {
          setStringValueOrDeleteProperty(series, 'color.palette', action.colorPalette);
        });
      }
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
    case actions.SET_ERROR_BARS_BAR_COLOR:
    case actions.SET_ERROR_BARS_LOWER_BOUND_COLUMN_NAME:
    case actions.SET_ERROR_BARS_UPPER_BOUND_COLUMN_NAME:
    case actions.SET_FILTERS:
    case actions.SET_LABEL_BOTTOM:
    case actions.SET_LABEL_LEFT:
    case actions.SET_MEASURE:
    case actions.SET_MEASURE_AGGREGATION:
    case actions.SET_MEASURE_AXIS_MAX_VALUE:
    case actions.SET_MEASURE_AXIS_MIN_VALUE:
    case actions.SET_ORDER_BY:
    case actions.SET_PRECISION:
    case actions.SET_PRIMARY_COLOR:
    case actions.SET_REFERENCE_LINE_COLOR:
    case actions.SET_REFERENCE_LINE_LABEL:
    case actions.SET_REFERENCE_LINE_VALUE:
    case actions.SET_SECONDARY_COLOR:
    case actions.SET_SHOW_LEGEND:
    case actions.SET_STACKED:
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
