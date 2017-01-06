import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import {
  forEachSeries,
  setStringValueOrDeleteProperty,
  setBooleanValueOrDefaultValue,
  setBooleanValueOrDeleteProperty
} from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DATASET_UID,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_DOMAIN,
  SET_FILTERS,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_ORDER_BY,
  SET_TITLE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_SHOW_VALUE_LABELS,
  SET_SHOW_VALUE_LABELS_AS_PERCENT,
  SET_COLOR_PALETTE,
  SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY,
  SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY,
  SET_SHOW_OTHER_CATEGORY
} from '../../actions';

export default function pieChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().pieChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().pieChart;
      break;

    case SET_COLOR_PALETTE:
      forEachSeries(state, series => {
        setStringValueOrDeleteProperty(series, 'color.palette', action.colorPalette, null);
      });
      break;

    case SET_SHOW_VALUE_LABELS:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabels', action.showValueLabels, true);
      break;

    case SET_SHOW_VALUE_LABELS_AS_PERCENT:
      setBooleanValueOrDefaultValue(state, 'configuration.showValueLabelsAsPercent', action.showValueLabelsAsPercent, false);
      break;

    case SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;

    case SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDeleteProperty(state, 'configuration.showOtherCategory', action.showOtherCategory);

      forEachSeries(state, series => {
        _.unset(series, 'dataSource.limit');
      });
      break;

    case SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);

      forEachSeries(state, series => {
        _.set(series, 'dataSource.limit', action.limitCount);
      });
      break;

    case SET_SHOW_OTHER_CATEGORY:
      setBooleanValueOrDefaultValue(state, 'configuration.showOtherCategory', action.showOtherCategory, true);
      break;

    case RECEIVE_METADATA:
    case SET_DATASET_UID:
    case SET_DESCRIPTION:
    case SET_DIMENSION:
    case SET_DOMAIN:
    case SET_FILTERS:
    case SET_MEASURE:
    case SET_MEASURE_AGGREGATION:
    case SET_TITLE:
    case SET_UNIT_ONE:
    case SET_UNIT_OTHER:
    case SET_VIEW_SOURCE_DATA_LINK:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
};
