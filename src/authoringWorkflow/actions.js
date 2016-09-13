import _ from 'lodash';
import moment from 'moment';

import MetadataProvider from '../dataProviders/MetadataProvider';
import RegionCodingProvider from '../dataProviders/RegionCodingProvider';
import { getVifs } from './selectors/vifAuthoring';

export const SET_VIF_CHECKPOINT = 'SET_VIF_CHECKPOINT';
export function setVifCheckpoint(vifs) {
  return {
    type: SET_VIF_CHECKPOINT,
    vifs
  };
}

export function setDataSource(domain, datasetUid) {
  return (dispatch, getState) => {
    if (!/\w{4}\-\w{4}/.test(datasetUid)) {
      return;
    }

    const datasetMetadataProvider = new MetadataProvider({ domain, datasetUid });

    dispatch(requestMetadata(domain, datasetUid));

    return Promise.all([
      datasetMetadataProvider.getDatasetMetadata(),
      datasetMetadataProvider.getPhidippidesMetadata(),
      datasetMetadataProvider.getCuratedRegions()
    ]).then(resolutions => {
      dispatch(receiveMetadata(resolutions));
      dispatch(setVifCheckpoint(getVifs(getState().vifAuthoring)));
    }).catch(error => {
      console.error(error);
      dispatch(handleMetadataError());
    });
  };
}

export const REQUEST_METADATA = 'REQUEST_METADATA';
export function requestMetadata(domain, datasetUid) {
  return {
    type: REQUEST_METADATA,
    domain,
    datasetUid
  };
}

export const RECEIVE_METADATA = 'RECEIVE_METADATA';
export function receiveMetadata(resolutions) {
  return {
    type: RECEIVE_METADATA,
    datasetMetadata: resolutions[0],
    phidippidesMetadata: resolutions[1],
    curatedRegions: resolutions[2]
  };
}

export const HANDLE_METADATA_ERROR = 'HANDLE_METADATA_ERROR';
export function handleMetadataError(error) {
  return {
    type: HANDLE_METADATA_ERROR,
    error
  };
}

export const SET_PHIDIPPIDES_METADATA = 'SET_PHIDIPPIDES_METADATA';
export function setPhidippidesMetadata(phidippidesMetadata) {
  return {
    type: SET_PHIDIPPIDES_METADATA,
    phidippidesMetadata
  };
}

export const SET_DATASET_UID = 'SET_DATASET_UID';
export function setDatasetUid(datasetUid) {
  return {
    type: SET_DATASET_UID,
    datasetUid
  };
}

export const SET_DOMAIN = 'SET_DOMAIN';
export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}

export const SET_DIMENSION = 'SET_DIMENSION';
export function setDimension(dimension) {
  return {
    type: SET_DIMENSION,
    dimension
  };
}

export const SET_MEASURE = 'SET_MEASURE';
export function setMeasure(measure) {
  return {
    type: SET_MEASURE,
    measure
  };
}

export const SET_MEASURE_AGGREGATION = 'SET_MEASURE_AGGREGATION';
export function setMeasureAggregation(measureAggregation) {
  return {
    type: SET_MEASURE_AGGREGATION,
    measureAggregation
  };
}

export const SET_VISUALIZATION_TYPE = 'SET_VISUALIZATION_TYPE';
export function setVisualizationType(visualizationType) {
  return {
    type: SET_VISUALIZATION_TYPE,
    visualizationType
  };
}

export const INITIATE_REGION_CODING = 'INITIATE_REGION_CODING';
export function initiateRegionCoding(domain, datasetUid, sourceColumn, curatedRegion) {
  return dispatch => {
    const providerOptions = { domain, datasetUid };
    const datasetMetadataProvider = new MetadataProvider(providerOptions);
    const regionCodingProvider = new RegionCodingProvider(providerOptions);
    const handleError = error => {
      dispatch(handleRegionCodingError(error));
    };
    const handleCompletion = () => {
      datasetMetadataProvider.
        getPhidippidesMetadata().
        then(metadata => {
          const columns = _.map(metadata.columns, (column, key) => {
            column.fieldName = key;
            return column;
          });

          const computedColumn = _.find(columns, column => {
            return _.get(column, 'computationStrategy.parameters.region', '').slice(1) === curatedRegion.uid;
          });

          dispatch(finishRegionCoding());
          dispatch(setComputedColumn(computedColumn.fieldName));
          dispatch(setPhidippidesMetadata(metadata));
        }).
        catch(handleError);
    };

    const handleInitiation = response => {
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

    const handleStatus = response => {
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

export const REQUEST_REGION_CODING = 'REQUEST_REGION_CODING';
export function requestRegionCoding() {
  return {
    type: REQUEST_REGION_CODING
  };
}

export const AWAIT_REGION_CODING = 'AWAIT_REGION_CODING';
export function awaitRegionCoding() {
  return {
    type: AWAIT_REGION_CODING,
    updatedAt: moment().calendar()
  };
}

export const FINISH_REGION_CODING = 'FINISH_REGION_CODING';
export function finishRegionCoding() {
  return {
    type: FINISH_REGION_CODING
  };
}

export const HANDLE_REGION_CODING_ERROR = 'HANDLE_REGION_CODING_ERROR';
export function handleRegionCodingError(error) {
  return {
    type: HANDLE_REGION_CODING_ERROR,
    error
  };
}

export const SET_COMPUTED_COLUMN = 'SET_COMPUTED_COLUMN';
export function setComputedColumn(computedColumn) {
  return {
    type: SET_COMPUTED_COLUMN,
    computedColumn
  };
}

export const REQUEST_SHAPEFILE_METADATA = 'REQUEST_SHAPEFILE_METADATA';
export function requestShapefileMetadata(domain, shapefileUid) {
  return dispatch => {
    const shapefileMetadataProvider = new MetadataProvider({domain, datasetUid: shapefileUid});
    const handleShapefileMetadataError = (error) => dispatch(handleShapefileMetadataError(error));
    const handleShapefileMetadata = ({ featurePk, geometryLabel }) => {
      dispatch(setShapefile(shapefileUid, featurePk, geometryLabel));
    };

    dispatch(requestShapefile());

    return shapefileMetadataProvider.
      getShapefileMetadata(shapefileUid).
      then(handleShapefileMetadata).
      catch(handleShapefileMetadataError);
  };
}

export const REQUEST_SHAPEFILE = 'REQUEST_SHAPEFILE';
export function requestShapefile() {
  return {
    type: REQUEST_SHAPEFILE
  };
}

export const SET_SHAPEFILE = 'SET_SHAPEFILE';
export function setShapefile(shapefileUid, shapefilePrimaryKey, shapefileGeometryLabel) {
  return {
    type: SET_SHAPEFILE,
    shapefileUid,
    shapefilePrimaryKey,
    shapefileGeometryLabel
  };
}

export const SET_SHAPEFILE_UID = 'SET_SHAPEFILE_UID';
export function setShapefileUid(shapefileUid) {
  return {
    type: SET_SHAPEFILE_UID,
    shapefileUid
  };
}

export const SET_SHAPEFILE_PRIMARY_KEY = 'SET_SHAPEFILE_PRIMARY_KEY';
export function setShapefilePrimaryKey(shapefilePrimaryKey) {
  return {
    type: SET_SHAPEFILE_PRIMARY_KEY,
    shapefilePrimaryKey
  };
}

export const SET_SHAPEFILE_GEOMETRY_LABEL = 'SET_SHAPEFILE_GEOMETRY_LABEL';
export function setShapefileGeometryLabel(shapefileGeometryLabel) {
  return {
    type: SET_SHAPEFILE_GEOMETRY_LABEL,
    shapefileGeometryLabel
  };
}

export const SET_TITLE = 'SET_TITLE';
export function setTitle(title) {
  return {
    type: SET_TITLE,
    title
  };
}

export const SET_DESCRIPTION = 'SET_DESCRIPTION';
export function setDescription(description) {
  return {
    type: SET_DESCRIPTION,
    description
  };
}

export const SET_VIEW_SOURCE_DATA_LINK = 'SET_VIEW_SOURCE_DATA_LINK';
export function setViewSourceDataLink(viewSourceDataLink) {
  return {
    type: SET_VIEW_SOURCE_DATA_LINK,
    viewSourceDataLink
  };
}

export const SET_PRIMARY_COLOR = 'SET_PRIMARY_COLOR';
export function setPrimaryColor(primaryColor) {
  return {
    type: SET_PRIMARY_COLOR,
    primaryColor
  };
}

export const SET_SECONDARY_COLOR = 'SET_SECONDARY_COLOR';
export function setSecondaryColor(secondaryColor) {
  return {
    type: SET_SECONDARY_COLOR,
    secondaryColor
  };
}

export const SET_POINT_OPACITY = 'SET_POINT_OPACITY';
export function setPointOpacity(pointOpacity) {
  return {
    type: SET_POINT_OPACITY,
    pointOpacity
  };
}

export const SET_COLOR_SCALE = 'SET_COLOR_SCALE';
export function setColorScale(negativeColor, zeroColor, positiveColor) {
  return {
    type: SET_COLOR_SCALE,
    negativeColor,
    zeroColor,
    positiveColor
  };
}

export const SET_NEGATIVE_COLOR = 'SET_NEGATIVE_COLOR';
export function setNegativeColor(negativeColor) {
  return {
    type: SET_NEGATIVE_COLOR,
    negativeColor
  };
}

export const SET_ZERO_COLOR = 'SET_ZERO_COLOR';
export function setZeroColor(zeroColor) {
  return {
    type: SET_ZERO_COLOR,
    zeroColor
  };
}
export const SET_POSITIVE_COLOR = 'SET_POSITIVE_COLOR';
export function setPositiveColor(positiveColor) {
  return {
    type: SET_POSITIVE_COLOR,
    positiveColor
  };
}

export const SET_BASE_LAYER = 'SET_BASE_LAYER';
export function setBaseLayer(baseLayer) {
  return {
    type: SET_BASE_LAYER,
    baseLayer
  };
}

export const SET_BASE_LAYER_OPACITY = 'SET_BASE_LAYER_OPACITY';
export function setBaseLayerOpacity(baseLayerOpacity) {
  return {
    type: SET_BASE_LAYER_OPACITY,
    baseLayerOpacity
  };
}

export const SET_LABEL_TOP = 'SET_LABEL_TOP';
export function setLabelTop(labelTop) {
  return {
    type: SET_LABEL_TOP,
    labelTop
  };
}

export const SET_LABEL_LEFT = 'SET_LABEL_LEFT';
export function setLabelLeft(labelLeft) {
  return {
    type: SET_LABEL_LEFT,
    labelLeft
  };
}

export const SET_LABEL_BOTTOM = 'SET_LABEL_BOTTOM';
export function setLabelBottom(labelBottom) {
  return {
    type: SET_LABEL_BOTTOM,
    labelBottom
  };
}

export const SET_LABEL_RIGHT = 'SET_LABEL_RIGHT';
export function setLabelRight(labelRight) {
  return {
    type: SET_LABEL_RIGHT,
    labelRight
  };
}

export const SET_X_AXIS_DATA_LABELS = 'SET_X_AXIS_DATA_LABELS';
export function setXAxisDataLabels(xAxisDataLabels) {
  return {
    type: SET_X_AXIS_DATA_LABELS,
    xAxisDataLabels
  };
}

export const SET_X_AXIS_SCALING_MODE = 'SET_X_AXIS_SCALING_MODE';
export function setXAxisScalingMode(shouldFit) {
  return {
    type: SET_X_AXIS_SCALING_MODE,
    xAxisScalingMode: shouldFit ? 'fit' : 'pan'
  };
}

export const SET_UNIT_ONE = 'SET_UNIT_ONE';
export function setUnitsOne(one) {
  return {
    type: SET_UNIT_ONE,
    one
  };
}

export const SET_UNIT_OTHER = 'SET_UNIT_OTHER';
export function setUnitsOther(other) {
  return {
    type: SET_UNIT_OTHER,
    other
  };
}


export const SET_ROW_INSPECTOR_TITLE_COLUMN_NAME = 'SET_ROW_INSPECTOR_TITLE_COLUMN_NAME';
export function setRowInspectorTitleColumnName(rowInspectorTitleColumnName) {
  return {
    type: SET_ROW_INSPECTOR_TITLE_COLUMN_NAME,
    rowInspectorTitleColumnName
  };
}

export const SET_CENTER_AND_ZOOM = 'SET_CENTER_AND_ZOOM';
export function setCenterAndZoom(centerAndZoom) {
  return {
    type: SET_CENTER_AND_ZOOM,
    centerAndZoom
  };
}

export const REQUEST_CENTER_AND_ZOOM = 'REQUEST_CENTER_AND_ZOOM';
export function requestCenterAndZoom(centerAndZoom) {
  return (dispatch) => {
    dispatch({ type: REQUEST_CENTER_AND_ZOOM });

    setTimeout(() => {
      dispatch(setCenterAndZoom(centerAndZoom));
    }, 3000);
  };
}

export const SET_ORDER_BY = 'SET_ORDER_BY';
export function setOrderBy(orderBy) {
  return {
    type: SET_ORDER_BY,
    orderBy
  };
}

export const SET_PRECISION = 'SET_PRECISION';
export function setPrecision(precision) {
  return {
    type: SET_PRECISION,
    precision
  };
}

export const SET_TREAT_NULL_VALUES_AS_ZERO = 'SET_TREAT_NULL_VALUES_AS_ZERO';
export function setTreatNullValuesAsZero(treatNullValuesAsZero) {
  return {
    type: SET_TREAT_NULL_VALUES_AS_ZERO,
    treatNullValuesAsZero
  };
}
