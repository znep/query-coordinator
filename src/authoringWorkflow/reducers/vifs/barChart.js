import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  setBooleanValueOrDefaultValue,
  setBooleanValueOrDeleteProperty,
  setStringValueOrDeleteProperty
} from '../../helpers';

import * as actions from '../../actions';

export default function barChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().barChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {

    case actions.RESET_STATE:
      state = vifs().barChart;
      break;

    case actions.SET_SHOW_DIMENSION_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showDimensionLabels', action.showDimensionLabels, true);
      break;

    case actions.SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
      break;

    case actions.SET_DIMENSION_GROUPING_COLUMN_NAME:
      const dimensionGroupingColumnName = action.dimensionGroupingColumnName;

      // Note that the 'dimension.grouping.columnName' property is only valid on
      // the first series of a vif, so we are not setting it on all series but
      // rather only the first.
      //
      // In this context, 'state' is the vif itself.
      _.set(
        state,
        'series[0].dataSource.dimension.grouping.columnName',
        dimensionGroupingColumnName
      );

      if (dimensionGroupingColumnName === null) {
        // If the dimension grouping functionality is being disabled, then we
        // also want to remove any color palette that has been set.
        _.unset(state, 'series[0].color.palette');
      } else {

        // Otherwise, if the color palette has not yet been set, then assign
        // the default palette.
        if (_.get(state, 'series[0].color.palette', null) === null) {
          _.set(state, 'series[0].color.palette', 'categorical');
        }
      }
      break;

    case actions.SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;

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
      _.set(state, 'series[0].color.palette', action.colorPalette);
      break;

    case actions.RECEIVE_METADATA:
    case actions.SET_DATASET_UID:
    case actions.SET_DESCRIPTION:
    case actions.SET_DIMENSION:
    case actions.SET_DOMAIN:
    case actions.SET_FILTERS:
    case actions.SET_LABEL_TOP:
    case actions.SET_LABEL_LEFT:
    case actions.SET_MEASURE:
    case actions.SET_MEASURE_AGGREGATION:
    case actions.SET_MEASURE_AXIS_MAX_VALUE:
    case actions.SET_MEASURE_AXIS_MIN_VALUE:
    case actions.SET_PRIMARY_COLOR:
    case actions.SET_SECONDARY_COLOR:
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
