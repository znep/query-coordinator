import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';

import * as actions from '../../actions';

export default function map(state, action) {
  if (_.isUndefined(state)) {
    return vifs().map;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.RESET_STATE:
      state = vifs().map;
      break;

    case actions.SET_DIMENSION:
      _.unset(state, 'configuration.mapCenterAndZoom');
      state = baseVifReducer(state, action);
      break;

    case actions.SET_PRIMARY_COLOR:
      _.set(state, 'series[0].color.primary', action.primaryColor);
      break;

    case actions.SET_COLOR_PALETTE:
      _.set(state, 'series[0].color.palette', action.colorPalette);
      break;

    case actions.SET_POINT_OPACITY:
      var opacity = parseFloat(action.pointOpacity);
      _.set(state, 'configuration.pointOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case actions.SET_POINT_SIZE:
      const size = parseFloat(action.pointSize);
      _.set(state, 'configuration.pointSize', _.isFinite(size) ? _.clamp(size, 1, 3.2) : null);
      break;

    case actions.SET_MINIMUM_LINE_WEIGHT:
      const minimumLineWeight = parseFloat(action.minimumLineWeight);
      _.set(state, 'series[0].mapOptions.minimumLineWeight', _.isFinite(minimumLineWeight) ? _.clamp(minimumLineWeight, 1, 10) : null);
      break;

    case actions.SET_MAXIMUM_LINE_WEIGHT:
      const maximumLineWeight = parseFloat(action.maximumLineWeight);
      _.set(state, 'series[0].mapOptions.maximumLineWeight', _.isFinite(maximumLineWeight) ? _.clamp(maximumLineWeight, 1, 10) : null);
      break;

    case actions.SET_MINIMUM_POINT_SIZE:
      const minimumPointSize = parseFloat(action.minimumPointSize);
      _.set(state, 'series[0].mapOptions.minimumPointSize', _.isFinite(minimumPointSize) ? _.clamp(minimumPointSize, 1, 10) : null);
      break;

    case actions.SET_MAXIMUM_POINT_SIZE:
      const maximumPointSize = parseFloat(action.maximumPointSize);
      _.set(state, 'series[0].mapOptions.maximumPointSize', _.isFinite(maximumPointSize) ? _.clamp(maximumPointSize, 1, 10) : null);
      break;

    case actions.SET_NUMBER_OF_DATA_CLASSES:
      var numberOfDataClasses = parseInt(action.numberOfDataClasses);
      _.set(state, 'series[0].mapOptions.numberOfDataClasses', _.isFinite(numberOfDataClasses) ? _.clamp(numberOfDataClasses, 2, 7) : null);
      break;

    case actions.SET_MAX_CLUSTERING_ZOOM_LEVEL:
      const maxClusteringZoomLevel = parseInt(action.maxClusteringZoomLevel);
      _.set(state, 'series[0].mapOptions.maxClusteringZoomLevel', _.isFinite(maxClusteringZoomLevel) ? _.clamp(maxClusteringZoomLevel, 1, 23) : null);
      break;

    case actions.SET_POINT_THRESHOLD:
      const pointThreshold = parseInt(action.pointThreshold);
      _.set(state, 'series[0].mapOptions.pointThreshold', _.isFinite(pointThreshold) ? _.clamp(pointThreshold, 100, 10000) : null);
      break;

    case actions.SET_CLUSTER_RADIUS:
      const clusterRadius = parseInt(action.clusterRadius);
      _.set(state, 'series[0].mapOptions.clusterRadius', _.isFinite(clusterRadius) ? _.clamp(clusterRadius, 1, 80) : null);
      break;

    case actions.SET_MAX_CLUSTER_SIZE:
      const maxClusterSize = parseInt(action.maxClusterSize);
      _.set(state, 'series[0].mapOptions.maxClusterSize', _.isFinite(maxClusterSize) ? _.clamp(maxClusterSize, 1, 10) : null);
      break;

    case actions.SET_STACK_RADIUS:
      const stackRadius = parseInt(action.stackRadius);
      _.set(state, 'series[0].mapOptions.stackRadius', _.isFinite(stackRadius) ? _.clamp(stackRadius, 1, 80) : null);
      break;

    case actions.SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case actions.SET_POINT_SIZE_BY_COLUMN:
      _.set(state, 'series[0].mapOptions.resizePointsBy', action.resizePointsBy);
      break;

    case actions.SET_POINT_COLOR_BY_COLUMN:
      _.set(state, 'series[0].mapOptions.colorPointsBy', action.colorPointsBy);
      break;

    case actions.SET_LINE_WEIGHT_BY_COLUMN:
      _.set(state, 'series[0].mapOptions.weighLinesBy', action.weighLinesBy);
      break;

    case actions.SET_LINE_COLOR_BY_COLUMN:
      _.set(state, 'series[0].mapOptions.colorLinesBy', action.colorLinesBy);
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

    case actions.SET_MAP_TYPE:
      _.set(state, 'series[0].mapOptions.mapType', action.mapType);
      break;

    case actions.SET_POINT_AGGREGATION:
      _.set(state, 'series[0].mapOptions.pointAggregation', action.pointAggregation);
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
