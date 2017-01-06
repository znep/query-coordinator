import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_FILTERS,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_PRIMARY_COLOR,
  SET_POINT_OPACITY,
  SET_POINT_SIZE,
  SET_BASE_LAYER,
  SET_BASE_LAYER_OPACITY,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_ROW_INSPECTOR_TITLE_COLUMN_NAME,
  SET_CENTER_AND_ZOOM,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_VIEW_SOURCE_DATA_LINK
} from '../../actions';

export default function featureMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().featureMap;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().featureMap;
      break;

    case SET_DIMENSION:
      _.unset(state, 'configuration.mapCenterAndZoom');
      state = baseVifReducer(state, action);
      break;

    case SET_PRIMARY_COLOR:
      _.set(state, 'series[0].color.primary', action.primaryColor);
      break;

    case SET_POINT_OPACITY:
      var opacity = parseFloat(action.pointOpacity);
      _.set(state, 'configuration.pointOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case SET_POINT_SIZE:
      const size = parseFloat(action.pointSize);
      _.set(state, 'configuration.pointSize', _.isFinite(size) ? _.clamp(size, 1, 3.2) : null);
      break;

    case SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case SET_BASE_LAYER_OPACITY:
      var opacity = parseFloat(action.baseLayerOpacity);
      _.set(state, 'configuration.baseLayerOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case SET_ROW_INSPECTOR_TITLE_COLUMN_NAME:
      _.set(state, 'configuration.rowInspectorTitleColumnName', action.rowInspectorTitleColumnName);
      break;

    case SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;

    case RECEIVE_METADATA:
    case SET_FILTERS:
    case SET_TITLE:
    case SET_DESCRIPTION:
    case SET_UNIT_ONE:
    case SET_UNIT_OTHER:
    case SET_DOMAIN:
    case SET_DATASET_UID:
    case SET_VIEW_SOURCE_DATA_LINK:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
