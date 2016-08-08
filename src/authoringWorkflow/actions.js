import _ from 'lodash';
import moment from 'moment';
import MetadataProvider from '../dataProviders/MetadataProvider';
import RegionCodingProvider from '../dataProviders/RegionCodingProvider';

export function setDataSource(domain, datasetUid) {
  return dispatch => {
    if (!/\w{4}\-\w{4}/.test(datasetUid)) {
      return;
    }

    var datasetMetadataProvider = new MetadataProvider({ domain, datasetUid });

    dispatch(requestMetadata(domain, datasetUid));

    return Promise.all([
      datasetMetadataProvider.getDatasetMetadata(),
      datasetMetadataProvider.getPhidippidesMetadata(),
      datasetMetadataProvider.getCuratedRegions()
    ]).then(resolutions => {
      dispatch(receiveMetadata(resolutions));
    }).catch(error => {
      console.error(error);
      dispatch(handleMetadataError());
    });
  };
}

export var REQUEST_METADATA = 'REQUEST_METADATA';
export function requestMetadata(domain, datasetUid) {
  return {
    type: REQUEST_METADATA,
    domain,
    datasetUid
  };
}

export var RECEIVE_METADATA = 'RECEIVE_METADATA';
export function receiveMetadata(resolutions) {
  return {
    type: RECEIVE_METADATA,
    datasetMetadata: resolutions[0],
    phidippidesMetadata: resolutions[1],
    curatedRegions: resolutions[2]
  };
}

export var HANDLE_METADATA_ERROR = 'HANDLE_METADATA_ERROR';
export function handleMetadataError(error) {
  return {
    type: HANDLE_METADATA_ERROR,
    error
  };
}

export var SET_PHIDIPPIDES_METADATA = 'SET_PHIDIPPIDES_METADATA';
export function setPhidippidesMetadata(phidippidesMetadata) {
  return {
    type: SET_PHIDIPPIDES_METADATA,
    phidippidesMetadata
  };
}

export var SET_DATASET_UID = 'SET_DATASET_UID';
export function setDatasetUid(datasetUid) {
  return {
    type: SET_DATASET_UID,
    datasetUid
  };
}

export var SET_DOMAIN = 'SET_DOMAIN';
export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}

export var SET_DIMENSION = 'SET_DIMENSION';
export function setDimension(dimension) {
  return {
    type: SET_DIMENSION,
    dimension
  };
}

export var SET_MEASURE = 'SET_MEASURE';
export function setMeasure(measure) {
  return {
    type: SET_MEASURE,
    measure
  };
}

export var SET_MEASURE_AGGREGATION = 'SET_MEASURE_AGGREGATION';
export function setMeasureAggregation(measureAggregation) {
  return {
    type: SET_MEASURE_AGGREGATION,
    measureAggregation
  };
}

export var SET_VISUALIZATION_TYPE = 'SET_VISUALIZATION_TYPE';
export function setVisualizationType(visualizationType) {
  return {
    type: SET_VISUALIZATION_TYPE,
    visualizationType
  };
}

export var INITIATE_REGION_CODING = 'INITIATE_REGION_CODING';
export function initiateRegionCoding(domain, datasetUid, sourceColumn, curatedRegion) {
  return dispatch => {
    var providerOptions = { domain, datasetUid };
    var datasetMetadataProvider = new MetadataProvider(providerOptions);
    var regionCodingProvider = new RegionCodingProvider(providerOptions);
    var handleError = error => {
      dispatch(handleRegionCodingError(error));
    };
    var handleCompletion = () => {
      datasetMetadataProvider.
        getPhidippidesMetadata().
        then(metadata => {
          var columns = _.map(metadata.columns, (column, key) => {
            column.fieldName = key;
            return column;
          });

          var computedColumn = _.find(columns, column => {
            return _.get(column, 'computationStrategy.parameters.region', '').slice(1) === curatedRegion.uid;
          });

          dispatch(finishRegionCoding());
          dispatch(setComputedColumn(computedColumn.fieldName));
          dispatch(setPhidippidesMetadata(metadata));
        }).
        catch(handleError);
    };

    var handleInitiation = response => {
      if (response.success) {
        dispatch(setComputedColumn(null));
        dispatch(setShapefile(curatedRegion.uid, curatedRegion.featurePk, curatedRegion.geometryLabel));

        regionCodingProvider.
          awaitRegionCodingCompletion({ jobId: response.jobId }, () => dispatch(awaitRegionCoding())).
          then(handleCompletion).
          catch(handleError);
      } else {
        handleError();
      }
    };

    var handleStatus = response => {
      switch (response.status) {
        case 'unknown':
          regionCodingProvider.
            initiateRegionCoding(curatedRegion.uid, sourceColumn).
            then(handleInitiation).
            catch(handleError);
          break;
        case 'processing':
          regionCodingProvider.
            awaitRegionCodingCompletion({ jobId: response.data.jobId }).
            then(handleCompletion).
            catch(handleError);
          break;
        case 'completed':
          handleCompletion();
          break;
        default:
          handleError();
          break;
      }
    };

    dispatch(requestRegionCoding());

    return regionCodingProvider.
      getRegionCodingStatus({ shapefileId: curatedRegion.uid }).
      then(handleStatus).
      catch(handleError);
  };
}

export var REQUEST_REGION_CODING = 'REQUEST_REGION_CODING';
export function requestRegionCoding() {
  return {
    type: REQUEST_REGION_CODING
  };
}

export var AWAIT_REGION_CODING = 'AWAIT_REGION_CODING';
export function awaitRegionCoding() {
  return {
    type: AWAIT_REGION_CODING,
    updatedAt: moment().calendar()
  };
}

export var FINISH_REGION_CODING = 'FINISH_REGION_CODING';
export function finishRegionCoding() {
  return {
    type: FINISH_REGION_CODING
  };
}

export var HANDLE_REGION_CODING_ERROR = 'HANDLE_REGION_CODING_ERROR';
export function handleRegionCodingError(error) {
  return {
    type: HANDLE_REGION_CODING_ERROR,
    error
  };
}

export var SET_COMPUTED_COLUMN = 'SET_COMPUTED_COLUMN';
export function setComputedColumn(computedColumn) {
  return {
    type: SET_COMPUTED_COLUMN,
    computedColumn
  };
}

export var REQUEST_SHAPEFILE_METADATA = 'REQUEST_SHAPEFILE_METADATA';
export function requestShapefileMetadata(domain, shapefileUid) {
  return dispatch => {
    var shapefileMetadataProvider = new MetadataProvider({domain, datasetUid: shapefileUid});
    var handleShapefileMetadataError = (error) => dispatch(handleShapefileMetadataError(error));
    var handleShapefileMetadata = ({ featurePk, geometryLabel }) => {
      dispatch(setShapefile(shapefileUid, featurePk, geometryLabel));
    };

    dispatch(requestShapefile());

    return shapefileMetadataProvider.
      getShapefileMetadata(shapefileUid).
      then(handleShapefileMetadata).
      catch(handleShapefileMetadataError);
  };
}

export var REQUEST_SHAPEFILE = 'REQUEST_SHAPEFILE';
export function requestShapefile() {
  return {
    type: REQUEST_SHAPEFILE
  };
}

export var SET_SHAPEFILE = 'SET_SHAPEFILE';
export function setShapefile(shapefileUid, shapefilePrimaryKey, shapefileGeometryLabel) {
  return {
    type: SET_SHAPEFILE,
    shapefileUid,
    shapefilePrimaryKey,
    shapefileGeometryLabel
  };
}

export var SET_TITLE = 'SET_TITLE';
export function setTitle(title) {
  return {
    type: SET_TITLE,
    title
  };
}

export var SET_DESCRIPTION = 'SET_DESCRIPTION';
export function setDescription(description) {
  return {
    type: SET_DESCRIPTION,
    description
  };
}

export var SET_PRIMARY_COLOR = 'SET_PRIMARY_COLOR';
export function setPrimaryColor(primaryColor) {
  return {
    type: SET_PRIMARY_COLOR,
    primaryColor
  };
}

export var SET_SECONDARY_COLOR = 'SET_SECONDARY_COLOR';
export function setSecondaryColor(secondaryColor) {
  return {
    type: SET_SECONDARY_COLOR,
    secondaryColor
  };
}

export var SET_POINT_OPACITY = 'SET_POINT_OPACITY';
export function setPointOpacity(pointOpacity) {
  return {
    type: SET_POINT_OPACITY,
    pointOpacity
  };
}

export var SET_COLOR_SCALE = 'SET_COLOR_SCALE';
export function setColorScale(negativeColor, zeroColor, positiveColor) {
  return {
    type: SET_COLOR_SCALE,
    negativeColor,
    zeroColor,
    positiveColor
  };
}

export var SET_NEGATIVE_COLOR = 'SET_NEGATIVE_COLOR';
export function setNegativeColor(negativeColor) {
  return {
    type: SET_NEGATIVE_COLOR,
    negativeColor
  };
}

export var SET_ZERO_COLOR = 'SET_ZERO_COLOR';
export function setZeroColor(zeroColor) {
  return {
    type: SET_ZERO_COLOR,
    zeroColor
  };
}
export var SET_POSITIVE_COLOR = 'SET_POSITIVE_COLOR';
export function setPositiveColor(positiveColor) {
  return {
    type: SET_POSITIVE_COLOR,
    positiveColor
  };
}

export var SET_BASE_LAYER = 'SET_BASE_LAYER';
export function setBaseLayer(baseLayer) {
  return {
    type: SET_BASE_LAYER,
    baseLayer
  };
}

export var SET_BASE_LAYER_OPACITY = 'SET_BASE_LAYER_OPACITY';
export function setBaseLayerOpacity(baseLayerOpacity) {
  return {
    type: SET_BASE_LAYER_OPACITY,
    baseLayerOpacity
  };
}

export var SET_LABEL_TOP = 'SET_LABEL_TOP';
export function setLabelTop(labelTop) {
  return {
    type: SET_LABEL_TOP,
    labelTop
  };
}

export var SET_LABEL_BOTTOM = 'SET_LABEL_BOTTOM';
export function setLabelBottom(labelBottom) {
  return {
    type: SET_LABEL_BOTTOM,
    labelBottom
  };
}

export var SET_LABEL_LEFT = 'SET_LABEL_LEFT';
export function setLabelLeft(labelLeft) {
  return {
    type: SET_LABEL_LEFT,
    labelLeft
  };
}

export var SET_LABEL_RIGHT = 'SET_LABEL_RIGHT';
export function setLabelRight(labelRight) {
  return {
    type: SET_LABEL_RIGHT,
    labelRight
  };
}

export var SET_X_AXIS_SCALING_MODE = 'SET_X_AXIS_SCALING_MODE';
export function setXAxisScalingMode(shouldFit) {
  return {
    type: SET_X_AXIS_SCALING_MODE,
    xAxisScalingMode: shouldFit ? 'fit' : 'pan'
  };
}

export var SET_UNIT_ONE = 'SET_UNIT_ONE';
export function setUnitsOne(one) {
  return {
    type: SET_UNIT_ONE,
    one
  };
}

export var SET_UNIT_OTHER = 'SET_UNIT_OTHER';
export function setUnitsOther(other) {
  return {
    type: SET_UNIT_OTHER,
    other
  };
}


export var SET_ROW_INSPECTOR_TITLE_COLUMN_NAME = 'SET_ROW_INSPECTOR_TITLE_COLUMN_NAME';
export function setRowInspectorTitleColumnName(rowInspectorTitleColumnName) {
  return {
    type: SET_ROW_INSPECTOR_TITLE_COLUMN_NAME,
    rowInspectorTitleColumnName
  };
}

export var SET_CENTER_AND_ZOOM = 'SET_CENTER_AND_ZOOM';
export function setCenterAndZoom(centerAndZoom) {
  return {
    type: SET_CENTER_AND_ZOOM,
    centerAndZoom
  };
}

export var REQUEST_CENTER_AND_ZOOM = 'REQUEST_CENTER_AND_ZOOM';
export function requestCenterAndZoom(centerAndZoom) {
  return (dispatch) => {
    dispatch({ type: REQUEST_CENTER_AND_ZOOM });

    setTimeout(() => {
      dispatch(setCenterAndZoom(centerAndZoom));
    }, 3000);
  };
}
