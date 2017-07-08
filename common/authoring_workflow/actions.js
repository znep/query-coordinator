import _ from 'lodash';
import moment from 'moment';

import { dataProviders } from 'common/visualizations';
import { getVifs, getColorPalette } from './selectors/vifAuthoring';
import { load } from './vifs/loader';

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

    const datasetMetadataProvider = new dataProviders.MetadataProvider({ domain, datasetUid });
    const soqlDataProvider = new dataProviders.SoqlDataProvider({ domain, datasetUid });

    dispatch(requestMetadata(domain, datasetUid));

    const finishMetadataRequests = (resolutions, hasColumnStats) => {
      dispatch(receiveMetadata(resolutions, hasColumnStats));
      dispatch(setVifCheckpoint(getVifs(getState().vifAuthoring)));
    };

    return Promise.all([
      datasetMetadataProvider.getDatasetMetadata(),
      datasetMetadataProvider.getPhidippidesMetadata()
    ]).then((resolutions) => {
      const datasetMetadata = resolutions[0];
      soqlDataProvider.getColumnStats(datasetMetadata.columns).then((columnStats) => {
        resolutions[0].columns = _.merge([], columnStats, resolutions[0].columns);
        finishMetadataRequests(resolutions, true);
      }).catch(() => {
        finishMetadataRequests(resolutions, false);
      });
    }).catch((error) => {
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
export function receiveMetadata(resolutions, hasColumnStats) {
  return {
    type: RECEIVE_METADATA,
    datasetMetadata: resolutions[0],
    phidippidesMetadata: resolutions[1],
    hasColumnStats
  };
}

export const HANDLE_METADATA_ERROR = 'HANDLE_METADATA_ERROR';
export function handleMetadataError(error) {
  return {
    type: HANDLE_METADATA_ERROR,
    error
  };
}

export function setCuratedRegions(domain, datasetUid) {
  return (dispatch) => {
    if (!/\w{4}\-\w{4}/.test(datasetUid)) {
      return;
    }

    const datasetMetadataProvider = new dataProviders.MetadataProvider({ domain, datasetUid });

    dispatch(requestCuratedRegions());

    return datasetMetadataProvider.getCuratedRegions().then((curatedRegions) => {
      dispatch(receiveCuratedRegions(curatedRegions));
    }).catch((error) => {
      console.error(error);
      dispatch(handleCuratedRegionsError());
    });
  };
}

export const REQUEST_CURATED_REGIONS = 'REQUEST_CURATED_REGIONS';
export function requestCuratedRegions() {
  return {
    type: REQUEST_CURATED_REGIONS
  };
}

export const RECEIVE_CURATED_REGIONS = 'RECEIVE_CURATED_REGIONS';
export function receiveCuratedRegions(curatedRegions) {
  return {
    type: RECEIVE_CURATED_REGIONS,
    curatedRegions
  };
}

export const HANDLE_CURATED_REGIONS_ERROR = 'HANDLE_CURATED_REGIONS_ERROR';
export function handleCuratedRegionsError() {
  return {
    type: HANDLE_CURATED_REGIONS_ERROR
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

export const SET_FILTERS = 'SET_FILTERS';
export function setFilters(filters) {
  return {
    type: SET_FILTERS,
    filters
  };
}

export const SET_DIMENSION = 'SET_DIMENSION';
export function setDimension(dimension) {
  return {
    type: SET_DIMENSION,
    dimension
  };
}

export const INITIALIZE_SERIES = 'INITIALIZE_SERIES';
export function initializeSeries(seriesCount) {
  return {
    type: INITIALIZE_SERIES,
    seriesCount
  };
}

export const APPEND_SERIES_WITH_MEASURE = 'APPEND_SERIES_WITH_MEASURE';
export function appendSeriesWithMeasure(measure) {
  return {
    type: APPEND_SERIES_WITH_MEASURE,
    measure
  };
}

export const REMOVE_SERIES = 'REMOVE_SERIES';
export function removeSeries(seriesIndex) {
  return {
    type: REMOVE_SERIES,
    seriesIndex
  };
}

export const SET_SERIES_MEASURE_COLUMN = 'SET_SERIES_MEASURE_COLUMN';
export function setSeriesMeasureColumn(seriesIndex, columnName, label) {
  return {
    type: SET_SERIES_MEASURE_COLUMN,
    seriesIndex,
    columnName,
    label
  };
}

export const SET_SERIES_MEASURE_AGGREGATION = 'SET_SERIES_MEASURE_AGGREGATION';
export function setSeriesMeasureAggregation(seriesIndex, aggregationFunction) {
  return {
    type: SET_SERIES_MEASURE_AGGREGATION,
    seriesIndex,
    aggregationFunction
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
  return (dispatch) => {
    const providerOptions = { domain, datasetUid };
    const datasetMetadataProvider = new dataProviders.MetadataProvider(providerOptions);
    const regionCodingProvider = new dataProviders.RegionCodingProvider(providerOptions);
    const handleError = (error) => {
      dispatch(handleRegionCodingError(error));
    };
    const handleCompletion = () => {
      datasetMetadataProvider.
        getPhidippidesMetadata().
        then((metadata) => {
          const columns = _.map(metadata.columns, (column, key) => {
            column.fieldName = key;
            return column;
          });

          const computedColumn = _.find(columns, (column) => {
            return _.get(column, 'computationStrategy.parameters.region', '').slice(1) === curatedRegion.uid;
          });

          dispatch(finishRegionCoding());
          dispatch(setComputedColumn(computedColumn.fieldName));
          dispatch(setPhidippidesMetadata(metadata));
        }).
        catch(handleError);
    };

    const handleInitiation = (response) => {
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

    const handleStatus = (response) => {
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
  return (dispatch) => {
    const shapefileMetadataProvider = new dataProviders.MetadataProvider({domain, datasetUid: shapefileUid});
    const handleShapefileMetadata = ({ featurePk, geometryLabel }) => {
      dispatch(setShapefile(shapefileUid, featurePk, geometryLabel));
    };

    dispatch(requestShapefile());

    return shapefileMetadataProvider.
      getShapefileMetadata(shapefileUid).
      then(handleShapefileMetadata);
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
export function setPrimaryColor(seriesIndex, primaryColor) {
  return {
    type: SET_PRIMARY_COLOR,
    seriesIndex,
    primaryColor
  };
}

export const SET_SECONDARY_COLOR = 'SET_SECONDARY_COLOR';
export function setSecondaryColor(secondaryColor, seriesIndex) {
  return {
    type: SET_SECONDARY_COLOR,
    seriesIndex,
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

export const SET_POINT_SIZE = 'SET_POINT_SIZE';
export function setPointSize(pointSize) {
  return {
    type: SET_POINT_SIZE,
    pointSize
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

export const SET_COLOR_PALETTE_PROPERTIES = 'SET_COLOR_PALETTE_PROPERTIES';
export function setColorPaletteProperties() {
  return (dispatch, getState) => {
    const { vifAuthoring } = getState();
    const hasCustomColorPalette = _.isEqual(getColorPalette(vifAuthoring), 'custom');

    dispatch({
      type: SET_COLOR_PALETTE_PROPERTIES
    });

    if (hasCustomColorPalette) {
      dataProviders.CustomColorPaletteManager.
        generateCustomColorPalette(vifAuthoring).then(
          ({customColorPalette, dimensionColumnName}) => {
            dispatch(setCustomColorPalette(customColorPalette, dimensionColumnName));
          }
      ).catch((error) => {
        dispatch(handleCustomColorPaletteError(error));
        console.error(error);
      });
    }
  };
}

export const HANDLE_CUSTOM_COLOR_PALETTE_ERROR = 'HANDLE_CUSTOM_COLOR_PALETTE_ERROR';
export function handleCustomColorPaletteError(error) {
  return {
    type: HANDLE_CUSTOM_COLOR_PALETTE_ERROR,
    error
  };
}

export const SET_COLOR_PALETTE = 'SET_COLOR_PALETTE';
export function setColorPalette(colorPalette) {
  return {
    type: SET_COLOR_PALETTE,
    colorPalette
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

export const SET_SHOW_DIMENSION_LABELS = 'SET_SHOW_DIMENSION_LABELS';
export function setShowDimensionLabels(showDimensionLabels) {
  return {
    type: SET_SHOW_DIMENSION_LABELS,
    showDimensionLabels
  };
}

export const SET_SHOW_VALUE_LABELS = 'SET_SHOW_VALUE_LABELS';
export function setShowValueLabels(showValueLabels) {
  return {
    type: SET_SHOW_VALUE_LABELS,
    showValueLabels
  };
}

export const SET_SHOW_VALUE_LABELS_AS_PERCENT = 'SET_SHOW_VALUE_LABELS_AS_PERCENT';
export function setShowValueLabelsAsPercent(showValueLabelsAsPercent) {
  return {
    type: SET_SHOW_VALUE_LABELS_AS_PERCENT,
    showValueLabelsAsPercent
  };
}

export const SET_SHOW_LEGEND = 'SET_SHOW_LEGEND';
export function setShowLegend(showLegend) {
  return {
    type: SET_SHOW_LEGEND,
    showLegend
  };
}

export const SET_X_AXIS_SCALING_MODE = 'SET_X_AXIS_SCALING_MODE';
export function setXAxisScalingMode(shouldFit) {
  return {
    type: SET_X_AXIS_SCALING_MODE,
    xAxisScalingMode: shouldFit ? 'fit' : 'pan'
  };
}

export const SET_MEASURE_AXIS_MIN_VALUE = 'SET_MEASURE_AXIS_MIN_VALUE';
export function setMeasureAxisMinValue(measureAxisMinValue) {
  return {
    type: SET_MEASURE_AXIS_MIN_VALUE,
    measureAxisMinValue
  };
}

export const SET_MEASURE_AXIS_MAX_VALUE = 'SET_MEASURE_AXIS_MAX_VALUE';
export function setMeasureAxisMaxValue(measureAxisMaxValue) {
  return {
    type: SET_MEASURE_AXIS_MAX_VALUE,
    measureAxisMaxValue
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

export const SET_DIMENSION_LABEL_AREA_SIZE = 'SET_DIMENSION_LABEL_AREA_SIZE';
export function setDimensionLabelAreaSize(width) {
  return {
    type: SET_DIMENSION_LABEL_AREA_SIZE,
    width
  };
}

export const SET_CENTER_AND_ZOOM = 'SET_CENTER_AND_ZOOM';
export function setCenterAndZoom(centerAndZoom) {
  return {
    type: SET_CENTER_AND_ZOOM,
    centerAndZoom
  };
}

export const SET_MAP_INFO_DISMISSED = 'SET_MAP_INFO_DISMISSED';
export function setMapInfoDismissed() {
  return {
    type: SET_MAP_INFO_DISMISSED
  };
}

export const SET_CUSTOM_COLOR_PALETTE = 'SET_CUSTOM_COLOR_PALETTE';
export function setCustomColorPalette(customColorPalette, dimensionGroupingColumnName) {
  return {
    type: SET_CUSTOM_COLOR_PALETTE,
    customColorPalette,
    dimensionGroupingColumnName
  };
}

export const UPDATE_CUSTOM_COLOR_PALETTE = 'UPDATE_CUSTOM_COLOR_PALETTE';
export function updateCustomColorPalette(selectedColor, group, dimensionGroupingColumnName) {
  return {
    type: UPDATE_CUSTOM_COLOR_PALETTE,
    selectedColor,
    group,
    dimensionGroupingColumnName
  };
}

export const SET_DIMENSION_GROUPING_COLUMN_NAME = 'SET_DIMENSION_GROUPING_COLUMN_NAME';
export function setDimensionGroupingColumnName(dimensionGroupingColumnName) {
  return {
    type: SET_DIMENSION_GROUPING_COLUMN_NAME,
    dimensionGroupingColumnName
  };
}

export const SET_STACKED = 'SET_STACKED';
export function setStacked(stacked) {
  return {
    type: SET_STACKED,
    stacked
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

export const SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY = 'SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY';
export function setLimitNoneAndShowOtherCategory() {
  return {
    type: SET_LIMIT_NONE_AND_SHOW_OTHER_CATEGORY,
    limitNone: true,
    showOtherCategory: false
  };
}

export const SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY = 'SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY';
export function setLimitCountAndShowOtherCategory(limitCount, showOtherCategory) {
  return {
    type: SET_LIMIT_COUNT_AND_SHOW_OTHER_CATEGORY,
    limitCount,
    showOtherCategory
  };
}

export const SET_SHOW_OTHER_CATEGORY = 'SET_SHOW_OTHER_CATEGORY';
export function setShowOtherCategory(showOtherCategory) {
  return {
    type: SET_SHOW_OTHER_CATEGORY,
    showOtherCategory
  };
}

export const RESET_STATE = 'RESET_STATE';
export function resetState() {
  return (dispatch, getState) => {
    const state = getState();

    // Dispatching RESET_STATE to all reducers
    // Reducers will return initial states
    dispatch({ type: RESET_STATE });

    // Trigger load on initial VIF
    load(dispatch, state.vifAuthoring.vifs.initialVif);
  };
}

export const SET_USER_ACTIVE = 'SET_USER_ACTIVE';
export function setUserActive() {
  return {
    type: SET_USER_ACTIVE
  };
}

export const SET_USER_IDLE = 'SET_USER_IDLE';
export function setUserIdle() {
  return {
    type: SET_USER_IDLE
  };
}
