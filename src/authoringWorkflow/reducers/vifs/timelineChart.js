import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import { forEachSeries, setBooleanValueOrDeleteProperty } from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_FILTERS,
  SET_DIMENSION,
  SET_DIMENSION_GROUPING_COLUMN_NAME,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_PRIMARY_COLOR,
  SET_COLOR_PALETTE,
  SET_LABEL_BOTTOM,
  SET_LABEL_LEFT,
  SET_X_AXIS_SCALING_MODE,
  SET_MEASURE_AXIS_MIN_VALUE,
  SET_MEASURE_AXIS_MAX_VALUE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_PRECISION,
  SET_TREAT_NULL_VALUES_AS_ZERO
} from '../../actions';

export default function timelineChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().timelineChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {

    case RESET_STATE:
      state = vifs().timelineChart;
      break;

    case SET_DIMENSION_GROUPING_COLUMN_NAME:
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

    case SET_PRECISION:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.precision', action.precision);
      });
      break;

    case SET_TREAT_NULL_VALUES_AS_ZERO:
      setBooleanValueOrDeleteProperty(state, 'configuration.treatNullValuesAsZero', action.treatNullValuesAsZero);
      break;

    case SET_COLOR_PALETTE:
      const groupingColumnName = _.get(
        state,
        'series[0].dataSource.dimension.grouping.columnName',
        null
      );

      // Note that the 'dimension.grouping.columnName' property is only valid on
      // the first series of a vif, so we only check the first series to
      // determine if the vif is using the dimension grouping functionality.
      //
      // In this context, 'state' is the vif itself.
      if (!_.isNull(groupingColumnName)) {
        _.set(state, 'series[0].color.palette', action.colorPalette);
      }
      break;

    case RECEIVE_METADATA:
    case SET_DATASET_UID:
    case SET_DESCRIPTION:
    case SET_DIMENSION:
    case SET_DOMAIN:
    case SET_FILTERS:
    case SET_LABEL_BOTTOM:
    case SET_LABEL_LEFT:
    case SET_MEASURE:
    case SET_MEASURE_AGGREGATION:
    case SET_MEASURE_AXIS_MAX_VALUE:
    case SET_MEASURE_AXIS_MIN_VALUE:
    case SET_PRIMARY_COLOR:
    case SET_TITLE:
    case SET_UNIT_ONE:
    case SET_UNIT_OTHER:
    case SET_VIEW_SOURCE_DATA_LINK:
    case SET_X_AXIS_SCALING_MODE:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
