import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import * as actions from '../../actions';

export default function regionMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().regionMap;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().regionMap;
      break;

    case actions.SET_COMPUTED_COLUMN:
      _.set(state, 'configuration.computedColumnName', action.computedColumn);
      break;

    case actions.SET_SHAPEFILE:
      _.set(state, 'configuration.shapefile.uid', action.shapefileUid);
      _.set(state, 'configuration.shapefile.primaryKey', action.shapefilePrimaryKey);
      _.set(state, 'configuration.shapefile.geometryLabel', action.shapefileGeometryLabel);
      break;

    case actions.SET_SHAPEFILE_UID:
      _.set(state, 'configuration.shapefile.uid', action.shapefileUid);
      break;

    case actions.SET_SHAPEFILE_PRIMARY_KEY:
      _.set(state, 'configuration.shapefile.primaryKey', action.shapefilePrimaryKey);
      break;

    case actions.SET_SHAPEFILE_GEOMETRY_LABEL:
      _.set(state, 'configuration.shapefile.geometryLabel', action.shapefileGeometryLabel);
      break;

    case actions.SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case actions.SET_BASE_LAYER_OPACITY:
      _.set(state, 'configuration.baseLayerOpacity', parseFloat(action.baseLayerOpacity));
      break;

    case actions.SET_COLOR_SCALE:
      _.set(state, 'configuration.legend.type', 'continuous');
      _.set(state, 'configuration.legend.negativeColor', action.negativeColor);
      _.set(state, 'configuration.legend.zeroColor', action.zeroColor);
      _.set(state, 'configuration.legend.positiveColor', action.positiveColor);
      break;

    case actions.SET_NEGATIVE_COLOR:
      _.set(state, 'configuration.legend.negativeColor', action.negativeColor);
      break;

    case actions.SET_ZERO_COLOR:
      _.set(state, 'configuration.legend.zeroColor', action.zeroColor);
      break;

    case actions.SET_POSITIVE_COLOR:
      _.set(state, 'configuration.legend.positiveColor', action.positiveColor);
      break;

    case actions.SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
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
}
