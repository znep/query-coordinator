import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import * as actions from '../../actions';

export default function featureMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().featureMap;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().featureMap;
      break;

    case actions.SET_DIMENSION:
      _.unset(state, 'configuration.mapCenterAndZoom');
      state = baseVifReducer(state, action);
      break;

    case actions.SET_PRIMARY_COLOR:
      _.set(state, 'series[0].color.primary', action.primaryColor);
      break;

    case actions.SET_POINT_OPACITY:
      var opacity = parseFloat(action.pointOpacity);
      _.set(state, 'configuration.pointOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case actions.SET_POINT_SIZE:
      const size = parseFloat(action.pointSize);
      _.set(state, 'configuration.pointSize', _.isFinite(size) ? _.clamp(size, 1, 3.2) : null);
      break;

    case actions.SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case actions.SET_BASE_LAYER_OPACITY:
      var baseLayerOpacity = parseFloat(action.baseLayerOpacity);
      _.set(state, 'configuration.baseLayerOpacity', _.isFinite(baseLayerOpacity) ? baseLayerOpacity : null);
      break;

    case actions.SET_ROW_INSPECTOR_TITLE_COLUMN_NAME:
      _.set(state, 'configuration.rowInspectorTitleColumnName', action.rowInspectorTitleColumnName);
      break;

    case actions.SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;

    case actions.RECEIVE_METADATA:
    case actions.SET_FILTERS:
    case actions.SET_TITLE:
    case actions.SET_DESCRIPTION:
    case actions.SET_UNIT_ONE:
    case actions.SET_UNIT_OTHER:
    case actions.SET_DOMAIN:
    case actions.SET_DATASET_UID:
    case actions.SET_VIEW_SOURCE_DATA_LINK:
      return baseVifReducer(state, action);

    default:
      break;
  }

  return state;
}
