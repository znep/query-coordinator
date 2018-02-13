import _ from 'lodash';

import vifs from '../../vifs';
import baseVifReducer from './base';
import * as actions from '../../actions';

import { VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';

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
      const opacity = parseFloat(action.pointOpacity);
      _.set(state, 'configuration.pointOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case actions.SET_POINT_SIZE:
      const size = parseFloat(action.pointSize);
      _.set(state, 'configuration.pointSize', _.isFinite(size) ? _.clamp(size, 1, 3.2) : null);
      break;

    case actions.SET_POINT_MAP_POINT_SIZE:
      const pointSize = parseFloat(action.pointMapPointSize);
      _.set(
        state,
        'series[0].mapOptions.pointMapPointSize',
        setDefault({ value: pointSize, constantKey: 'POINT_MAP_POINT_SIZE' })
      );
      break;

    case actions.SET_LINE_WEIGHT:
      const lineWeight = parseFloat(action.lineWeight);
      _.set(
        state,
        'series[0].mapOptions.lineWeight',
        setDefault({ value: lineWeight, constantKey: 'LINE_WEIGHT' })
      );
      break;

    case actions.SET_MINIMUM_LINE_WEIGHT:
      const minimumLineWeight = parseFloat(action.minimumLineWeight);
      _.set(state,
        'series[0].mapOptions.minimumLineWeight',
        setDefault({ value: minimumLineWeight, constantKey: 'LINE_MAP_MIN_LINE_WEIGHT' })
      );
      break;

    case actions.SET_MAXIMUM_LINE_WEIGHT:
      const maximumLineWeight = parseFloat(action.maximumLineWeight);
      _.set(state,
        'series[0].mapOptions.maximumLineWeight',
        setDefault({ value: maximumLineWeight, constantKey: 'LINE_MAP_MAX_LINE_WEIGHT' })
      );
      break;

    case actions.SET_MINIMUM_POINT_SIZE:
      const minimumPointSize = parseFloat(action.minimumPointSize);
      _.set(state,
        'series[0].mapOptions.minimumPointSize',
        setDefault({ value: minimumPointSize, constantKey: 'POINT_MAP_MIN_POINT_SIZE' })
      );
      break;

    case actions.SET_MAXIMUM_POINT_SIZE:
      const maximumPointSize = parseFloat(action.maximumPointSize);
      _.set(state,
        'series[0].mapOptions.maximumPointSize',
        setDefault({ value: maximumPointSize, constantKey: 'POINT_MAP_MAX_POINT_SIZE' })
      );
      break;

    case actions.SET_NUMBER_OF_DATA_CLASSES:
      const numberOfDataClasses = parseInt(action.numberOfDataClasses);
      _.set(
        state,
        'series[0].mapOptions.numberOfDataClasses',
        setDefault({ value: numberOfDataClasses, constantKey: 'NUMBER_OF_DATA_CLASSES' })
      );
      break;

    case actions.SET_MAX_CLUSTERING_ZOOM_LEVEL:
      const maxClusteringZoomLevel = parseInt(action.maxClusteringZoomLevel);
      _.set(state,
        'series[0].mapOptions.maxClusteringZoomLevel',
        setDefault({ value: maxClusteringZoomLevel, constantKey: 'CLUSTERING_ZOOM' })
      );
      break;

    case actions.SET_POINT_THRESHOLD:
      const pointThreshold = parseInt(action.pointThreshold);
      _.set(state,
        'series[0].mapOptions.pointThreshold',
        setDefault({ value: pointThreshold, constantKey: 'POINT_THRESHOLD' })
      );
      break;

    case actions.SET_CLUSTER_RADIUS:
      const clusterRadius = parseInt(action.clusterRadius);
      _.set(state,
        'series[0].mapOptions.clusterRadius',
        setDefault({ value: clusterRadius, constantKey: 'CLUSTER_RADIUS' })
      );
      break;

    case actions.SET_MAX_CLUSTER_SIZE:
      const maxClusterSize = parseInt(action.maxClusterSize);
      _.set(state,
        'series[0].mapOptions.maxClusterSize',
        setDefault({ value: maxClusterSize, constantKey: 'CLUSTER_SIZE' })
      );
      break;

    case actions.SET_STACK_RADIUS:
      const stackRadius = parseInt(action.stackRadius);
      _.set(state,
        'series[0].mapOptions.stackRadius',
        setDefault({ value: stackRadius, constantKey: 'STACK_RADIUS' })
      );
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

    case actions.SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;

    case actions.SET_MAP_TYPE:
      _.set(state, 'series[0].mapOptions.mapType', action.mapType);
      break;

    case actions.SET_BOUNDARY_COLOR_BY_COLUMN:
      _.set(state, 'series[0].mapOptions.colorBoundariesBy', action.colorBoundariesBy);
      break;

    case actions.SET_QUANTIFICATION_METHOD:
      _.set(state, 'series[0].mapOptions.quantificationMethod', action.quantificationMethod);
      break;

    case actions.SET_POINT_AGGREGATION:
      _.set(state, 'series[0].mapOptions.pointAggregation', action.pointAggregation);
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

    case actions.SET_MEASURE_AGGREGATION:
    case actions.SET_MEASURE_COLUMN:
      if (!action.isFlyoutSeries && (action.relativeIndex == 0)) {
        return baseVifReducer(state, action);
      }
      break;

    case actions.SET_BASE_MAP_STYLE:
      _.set(state, 'configuration.baseMapStyle', action.baseMapStyle);
      break;

    case actions.SET_BASE_MAP_OPACITY:
      const baseMapOpacity = parseFloat(action.baseMapOpacity);
      _.set(state, 'configuration.baseMapOpacity', _.isNaN(baseMapOpacity) ? 1 : _.clamp(baseMapOpacity, 0, 1));
      break;

    case actions.SET_NAVIGATION_CONTROL:
      _.set(state, 'configuration.navigationControl', action.navigationControl);
      break;

    case actions.SET_GEO_CODER_CONTROL:
      _.set(state, 'configuration.geoCoderControl', action.geoCoderControl);
      break;

    case actions.SET_GEO_LOCATE_CONTROL:
      _.set(state, 'configuration.geoLocateControl', action.geoLocateControl);
      break;

    case actions.SET_MAP_FLYOUT_TITLE_COLUMN_NAME:
      _.set(state, 'series[0].mapOptions.mapFlyoutTitleColumnName', action.mapFlyoutTitleColumnName);
      break;

    case actions.ADD_BASEMAP_FLYOUT_COLUMN:
      const flyoutColumns = _.get(state, 'series[0].mapOptions.additionalFlyoutColumns', []);

      flyoutColumns.push(action.columnName);
      _.set(state, 'series[0].mapOptions.additionalFlyoutColumns', flyoutColumns);
      break;

    case actions.REMOVE_BASEMAP_FLYOUT_COLUMN:
      let additionalFlyoutColumns = _.get(state, 'series[0].mapOptions.additionalFlyoutColumns', []);

      additionalFlyoutColumns.splice(action.relativeIndex, 1);
      _.set(state, 'series[0].mapOptions.additionalFlyoutColumns', additionalFlyoutColumns);
      break;

    case actions.CHANGE_ADDITIONAL_FLYOUT_COLUMN:
      const columns = _.get(state, 'series[0].mapOptions.additionalFlyoutColumns', []);

      columns[action.relativeIndex] = action.columnName;
      _.set(state, 'series[0].mapOptions.additionalFlyoutColumns', columns);
      break;

    case actions.SET_ADDITIONAL_FLYOUT_COLUMNS:
      _.set(state, 'series[0].mapOptions.additionalFlyoutColumns', action.columns);
      break;

    case actions.SET_SEARCH_BOUNDARY_UPPER_LEFT_LATITUDE:
      const upperLeftLatitude = parseFloat(action.searchBoundaryUpperLeftLatitude);
      _.set(state, 'series[0].mapOptions.searchBoundaryUpperLeftLatitude', upperLeftLatitude);
      break;

    case actions.SET_SEARCH_BOUNDARY_UPPER_LEFT_LONGITUDE:
      const upperLeftLongitude = parseFloat(action.searchBoundaryUpperLeftLongitude);
      _.set(state, 'series[0].mapOptions.searchBoundaryUpperLeftLongitude', upperLeftLongitude);
      break;

    case actions.SET_SEARCH_BOUNDARY_LOWER_RIGHT_LATITUDE:
      const lowerRightLatitude = parseFloat(action.searchBoundaryLowerRightLatitude);
      _.set(state, 'series[0].mapOptions.searchBoundaryLowerRightLatitude', lowerRightLatitude);
      break;

    case actions.SET_SEARCH_BOUNDARY_LOWER_RIGHT_LONGITUDE:
      const lowerRightLongitude = parseFloat(action.searchBoundaryLowerRightLongitude);
      _.set(state, 'series[0].mapOptions.searchBoundaryLowerRightLongitude', lowerRightLongitude);
      break;

    case actions.SET_PITCH_AND_BEARING:
      _.set(state, 'configuration.mapPitchAndBearing', action.pitchAndBearing);
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

function setDefault({ value: defaultValue, constantKey: constantKeyToFetchValue }) {
  const minValue = VIF_CONSTANTS[constantKeyToFetchValue].MIN;
  const maxValue = VIF_CONSTANTS[constantKeyToFetchValue].MAX;

  return _.isFinite(defaultValue) ? _.clamp(defaultValue, minValue, maxValue) : null;
}
