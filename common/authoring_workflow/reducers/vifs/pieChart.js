import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  setStringValueOrDeleteProperty,
  setBooleanValueOrDefaultValue,
  setBooleanValueOrDeleteProperty
} from '../../helpers';

import * as actions from '../../actions';

export default function pieChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().pieChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().pieChart;
      break;

    case actions.SET_COLOR_PALETTE:
      _.set(state, 'series[0].color.palette', action.colorPalette);
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

    case actions.SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
      break;

    case actions.SET_SHOW_VALUE_LABELS_AS_PERCENT:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabelsAsPercent', action.showValueLabelsAsPercent, false);
      break;

    case actions.SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;

    case actions.SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);

      forEachSeries(state, series => {
        _.set(series, 'dataSource.limit', action.limitCount);
      });
      break;

    case actions.SET_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);
      break;

    case actions.RECEIVE_METADATA:
    case actions.SET_DATASET_UID:
    case actions.SET_DESCRIPTION:
    case actions.SET_DIMENSION:
    case actions.SET_DOMAIN:
    case actions.SET_FILTERS:
    case actions.SET_SERIES_MEASURE_AGGREGATION:
    case actions.SET_SERIES_MEASURE_COLUMN:
    case actions.SET_TITLE:
    case actions.SET_UNIT_ONE:
    case actions.SET_UNIT_OTHER:
    case actions.SET_VIEW_SOURCE_DATA_LINK:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
};
