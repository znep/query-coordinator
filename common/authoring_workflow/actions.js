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

    const datasetMetadataProvider = new dataProviders.MetadataProvider({ domain, datasetUid }, true);
    const soqlDataProvider = new dataProviders.SoqlDataProvider({ domain, datasetUid }, true);

    dispatch(requestMetadata(domain, datasetUid));

    const finishMetadataRequests = (datasetMetadata, baseViewMetadata, hasColumnStats) => {
      dispatch(receiveMetadata(datasetMetadata, baseViewMetadata, hasColumnStats));
      dispatch(setVifCheckpoint(getVifs(getState().vifAuthoring)));
    };

    return Promise.all([
      // See comment in implementation to learn why we catch-all.
      datasetMetadataProvider.getBaseViewMetadata().catch(() => null),
      datasetMetadataProvider.getDatasetMetadata()
    ]).then((resolutions) => {
      const datasetMetadata = resolutions[1];
      const baseViewMetadata = resolutions[0] || datasetMetadata;

      return soqlDataProvider.getColumnStats(datasetMetadata.columns).then((columnStats) => {
        datasetMetadata.columns = _.merge([], columnStats, datasetMetadata.columns);
        finishMetadataRequests(datasetMetadata, baseViewMetadata, true);
      }).catch(() => {
        finishMetadataRequests(datasetMetadata, baseViewMetadata, false);
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
export function receiveMetadata(datasetMetadata, baseViewMetadata, hasColumnStats) {
  return {
    type: RECEIVE_METADATA,
    datasetMetadata,
    baseViewMetadata,
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

    const datasetMetadataProvider = new dataProviders.MetadataProvider({ domain, datasetUid }, true);

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

export const APPEND_SERIES = 'APPEND_SERIES';
export function appendSeries({ isFlyoutSeries, isInitialLoad, measureColumnName, seriesVariant }) {
  return {
    type: APPEND_SERIES,
    isFlyoutSeries,
    isInitialLoad,
    measureColumnName,
    seriesVariant
  };
}

export const REMOVE_SERIES = 'REMOVE_SERIES';
export function removeSeries({ isFlyoutSeries, relativeIndex }) {
  return {
    type: REMOVE_SERIES,
    isFlyoutSeries,
    relativeIndex
  };
}

export const SET_SERIES_VARIANT = 'SET_SERIES_VARIANT';
export function setSeriesVariant(seriesIndex, seriesVariant) {
  return {
    type: SET_SERIES_VARIANT,
    seriesIndex,
    seriesVariant
  };
}

export const SET_MEASURE_AGGREGATION = 'SET_MEASURE_AGGREGATION';
export function setMeasureAggregation({ aggregationFunction, isFlyoutSeries, relativeIndex }) {
  return {
    type: SET_MEASURE_AGGREGATION,
    aggregationFunction,
    isFlyoutSeries,
    relativeIndex
  };
}

export const SET_MEASURE_COLUMN = 'SET_MEASURE_COLUMN';
export function setMeasureColumn({ columnName, isFlyoutSeries, relativeIndex }) {
  return {
    type: SET_MEASURE_COLUMN,
    columnName,
    isFlyoutSeries,
    relativeIndex
  };
}

export const APPEND_REFERENCE_LINE = 'APPEND_REFERENCE_LINE';
export function appendReferenceLine() {
  return {
    type: APPEND_REFERENCE_LINE
  };
}

export const REMOVE_REFERENCE_LINE = 'REMOVE_REFERENCE_LINE';
export function removeReferenceLine(referenceLineIndex) {
  return {
    type: REMOVE_REFERENCE_LINE,
    referenceLineIndex
  };
}

export const SET_REFERENCE_LINE_COLOR = 'SET_REFERENCE_LINE_COLOR';
export function setReferenceLineColor({ referenceLineIndex, color }) {
  return {
    type: SET_REFERENCE_LINE_COLOR,
    referenceLineIndex,
    color
  };
}

export const SET_REFERENCE_LINE_LABEL = 'SET_REFERENCE_LINE_LABEL';
export function setReferenceLineLabel({ referenceLineIndex, label }) {
  return {
    type: SET_REFERENCE_LINE_LABEL,
    referenceLineIndex,
    label
  };
}

export const SET_REFERENCE_LINE_VALUE = 'SET_REFERENCE_LINE_VALUE';
export function setReferenceLineValue({ referenceLineIndex, value }) {
  return {
    type: SET_REFERENCE_LINE_VALUE,
    referenceLineIndex,
    value
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
        getDatasetMetadata().
        then((metadata) => {
          // TODO why is this not defined? Disabling lint warning for now.
          // eslint-disable-next-line no-undef
          const computedColumn = _.find(columns, (column) => {
            return _.get(column, 'computationStrategy.parameters.region', '').slice(1) === curatedRegion.uid;
          });

          dispatch(finishRegionCoding());
          dispatch(setComputedColumn(computedColumn.fieldName));
          // TODO why is this not defined? Disabling lint warning for now.
          // eslint-disable-next-line no-undef
          dispatch(setDatasetMetadata(metadata));
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
    const shapefileMetadataProvider = new dataProviders.MetadataProvider({ domain, datasetUid: shapefileUid });
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
export function setSecondaryColor(seriesIndex, secondaryColor) {
  return {
    type: SET_SECONDARY_COLOR,
    seriesIndex,
    secondaryColor
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
          ({ customColorPalette, dimensionColumnName }) => {
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

export const SET_SHOW_LEGEND_OPENED = 'SET_SHOW_LEGEND_OPENED';
export function setShowLegendOpened(showLegendOpened) {
  return {
    type: SET_SHOW_LEGEND_OPENED,
    showLegendOpened
  };
}

export const SET_X_AXIS_SCALING_MODE = 'SET_X_AXIS_SCALING_MODE';
export function setXAxisScalingMode({ shouldFit }) {
  return {
    type: SET_X_AXIS_SCALING_MODE,
    xAxisScalingMode: shouldFit ? 'fit' : 'pan'
  };
}

export const SET_MEASURE_AXIS_MAX_VALUE = 'SET_MEASURE_AXIS_MAX_VALUE';
export function setMeasureAxisMaxValue(measureAxisMaxValue) {
  return {
    type: SET_MEASURE_AXIS_MAX_VALUE,
    measureAxisMaxValue
  };
}

export const SET_MEASURE_AXIS_MIN_VALUE = 'SET_MEASURE_AXIS_MIN_VALUE';
export function setMeasureAxisMinValue(measureAxisMinValue) {
  return {
    type: SET_MEASURE_AXIS_MIN_VALUE,
    measureAxisMinValue
  };
}

export const SET_SECONDARY_MEASURE_AXIS_MAX_VALUE = 'SET_SECONDARY_MEASURE_AXIS_MAX_VALUE';
export function setSecondaryMeasureAxisMaxValue(measureAxisMaxValue) {
  return {
    type: SET_SECONDARY_MEASURE_AXIS_MAX_VALUE,
    measureAxisMaxValue
  };
}

export const SET_SECONDARY_MEASURE_AXIS_MIN_VALUE = 'SET_SECONDARY_MEASURE_AXIS_MIN_VALUE';
export function setSecondaryMeasureAxisMinValue(measureAxisMinValue) {
  return {
    type: SET_SECONDARY_MEASURE_AXIS_MIN_VALUE,
    measureAxisMinValue
  };
}

export const SET_UNIT_ONE = 'SET_UNIT_ONE';
export function setUnitsOne(seriesIndex, one) {
  return {
    type: SET_UNIT_ONE,
    seriesIndex,
    one
  };
}

export const SET_UNIT_OTHER = 'SET_UNIT_OTHER';
export function setUnitsOther(seriesIndex, other) {
  return {
    type: SET_UNIT_OTHER,
    seriesIndex,
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

export const SET_ERROR_BARS_BAR_COLOR = 'SET_ERROR_BARS_BAR_COLOR';
export function setErrorBarsBarColor(color) {
  return {
    type: SET_ERROR_BARS_BAR_COLOR,
    color
  };
}

export const SET_ERROR_BARS_LOWER_BOUND_COLUMN_NAME = 'SET_ERROR_BARS_LOWER_BOUND_COLUMN_NAME';
export function setErrorBarsLowerBoundColumnName(columnName) {
  return {
    type: SET_ERROR_BARS_LOWER_BOUND_COLUMN_NAME,
    columnName
  };
}

export const SET_ERROR_BARS_UPPER_BOUND_COLUMN_NAME = 'SET_ERROR_BARS_UPPER_BOUND_COLUMN_NAME';
export function setErrorBarsUpperBoundColumnName(columnName) {
  return {
    type: SET_ERROR_BARS_UPPER_BOUND_COLUMN_NAME,
    columnName
  };
}

export const SET_STACKED = 'SET_STACKED';
export function setStacked({ stacked, oneHundredPercent }) {
  return {
    type: SET_STACKED,
    stacked,
    oneHundredPercent
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

export const SET_USE_SECONDARY_AXIS_FOR_COLUMNS = 'SET_USE_SECONDARY_AXIS_FOR_COLUMNS';
export function setUseSecondaryAxisForColumns(useSecondaryAxis) {
  return {
    type: SET_USE_SECONDARY_AXIS_FOR_COLUMNS,
    useSecondaryAxis
  };
}

export const SET_USE_SECONDARY_AXIS_FOR_LINES = 'SET_USE_SECONDARY_AXIS_FOR_LINES';
export function setUseSecondaryAxisForLines(useSecondaryAxis) {
  return {
    type: SET_USE_SECONDARY_AXIS_FOR_LINES,
    useSecondaryAxis
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

export const SET_MAP_TYPE = 'SET_MAP_TYPE';
export function setMapType(mapType) {
  return {
    type: SET_MAP_TYPE,
    mapType
  };
}

export const SET_POINT_SIZE = 'SET_POINT_SIZE';
export function setPointSize(pointSize) {
  return {
    type: SET_POINT_SIZE,
    pointSize
  };
}

export const SET_POINT_MAP_POINT_SIZE = 'SET_POINT_MAP_POINT_SIZE';
export function setPointMapPointSize(pointMapPointSize) {
  return {
    type: SET_POINT_MAP_POINT_SIZE,
    pointMapPointSize
  };
}

export const SET_POINT_OPACITY = 'SET_POINT_OPACITY';
export function setPointOpacity(pointOpacity) {
  return {
    type: SET_POINT_OPACITY,
    pointOpacity
  };
}

export const SET_RESIZE_POINTS_BY_COLUMN = 'SET_RESIZE_POINTS_BY_COLUMN';
export function setResizePointsByColumn(resizePointsBy) {
  return {
    type: SET_RESIZE_POINTS_BY_COLUMN,
    resizePointsBy
  };
}

export const SET_MINIMUM_POINT_SIZE = 'SET_MINIMUM_POINT_SIZE';
export function setMinimumPointSize(minimumPointSize) {
  return {
    type: SET_MINIMUM_POINT_SIZE,
    minimumPointSize
  };
}

export const SET_MAXIMUM_POINT_SIZE = 'SET_MAXIMUM_POINT_SIZE';
export function setMaximumPointSize(maximumPointSize) {
  return {
    type: SET_MAXIMUM_POINT_SIZE,
    maximumPointSize
  };
}

export const SET_NUMBER_OF_DATA_CLASSES = 'SET_NUMBER_OF_DATA_CLASSES';
export function setNumberOfDataClasses(numberOfDataClasses) {
  return {
    type: SET_NUMBER_OF_DATA_CLASSES,
    numberOfDataClasses
  };
}

export const SET_MAX_CLUSTERING_ZOOM_LEVEL = 'SET_MAX_CLUSTERING_ZOOM_LEVEL';
export function setMaxClusteringZoomLevel(maxClusteringZoomLevel) {
  return {
    type: SET_MAX_CLUSTERING_ZOOM_LEVEL,
    maxClusteringZoomLevel
  };
}

export const SET_POINT_THRESHOLD = 'SET_POINT_THRESHOLD';
export function setPointThreshold(pointThreshold) {
  return {
    type: SET_POINT_THRESHOLD,
    pointThreshold
  };
}

export const SET_CLUSTER_RADIUS = 'SET_CLUSTER_RADIUS';
export function setClusterRadius(clusterRadius) {
  return {
    type: SET_CLUSTER_RADIUS,
    clusterRadius
  };
}

export const SET_MAX_CLUSTER_SIZE = 'SET_MAX_CLUSTER_SIZE';
export function setMaxClusterSize(maxClusterSize) {
  return {
    type: SET_MAX_CLUSTER_SIZE,
    maxClusterSize
  };
}

export const SET_STACK_RADIUS = 'SET_STACK_RADIUS';
export function setStackRadius(stackRadius) {
  return {
    type: SET_STACK_RADIUS,
    stackRadius
  };
}

export const SET_COLOR_POINTS_BY_COLUMN = 'SET_COLOR_POINTS_BY_COLUMN';
export function setColorPointsByColumn(colorPointsBy) {
  return {
    type: SET_COLOR_POINTS_BY_COLUMN,
    colorPointsBy
  };
}

export const SET_LINE_WEIGHT = 'SET_LINE_WEIGHT';
export function setLineWeight(lineWeight) {
  return {
    type: SET_LINE_WEIGHT,
    lineWeight
  };
}

export const SET_WEIGH_LINES_BY_COLUMN = 'SET_WEIGH_LINES_BY_COLUMN';
export function setWeighLinesByColumn(weighLinesBy) {
  return {
    type: SET_WEIGH_LINES_BY_COLUMN,
    weighLinesBy
  };
}

export const SET_MINIMUM_LINE_WEIGHT = 'SET_MINIMUM_LINE_WEIGHT';
export function setMinimumLineWeight(minimumLineWeight) {
  return {
    type: SET_MINIMUM_LINE_WEIGHT,
    minimumLineWeight
  };
}

export const SET_MAXIMUM_LINE_WEIGHT = 'SET_MAXIMUM_LINE_WEIGHT';
export function setMaximumLineWeight(maximumLineWeight) {
  return {
    type: SET_MAXIMUM_LINE_WEIGHT,
    maximumLineWeight
  };
}

export const SET_COLOR_LINES_BY_COLUMN = 'SET_COLOR_LINES_BY_COLUMN';
export function setColorLinesByColumn(colorLinesBy) {
  return {
    type: SET_COLOR_LINES_BY_COLUMN,
    colorLinesBy
  };
}

export const SET_BOUNDARY_COLOR_BY_COLUMN = 'SET_BOUNDARY_COLOR_BY_COLUMN';
export function setBoundaryColorByColumn(colorBoundariesBy) {
  return {
    type: SET_BOUNDARY_COLOR_BY_COLUMN,
    colorBoundariesBy
  };
}

export const SET_QUANTIFICATION_METHOD = 'SET_QUANTIFICATION_METHOD';
export function setQuantificationMethod(quantificationMethod) {
  return {
    type: SET_QUANTIFICATION_METHOD,
    quantificationMethod
  };
}

export const SET_POINT_AGGREGATION = 'SET_POINT_AGGREGATION';
export function setPointAggregation(pointAggregation) {
  return {
    type: SET_POINT_AGGREGATION,
    pointAggregation
  };
}

export const SET_BASE_MAP_STYLE = 'SET_BASE_MAP_STYLE';
export function setBaseMapStyle(baseMapStyle) {
  return {
    type: SET_BASE_MAP_STYLE,
    baseMapStyle
  };
}

export const SET_BASE_MAP_OPACITY = 'SET_BASE_MAP_OPACITY';
export function setBaseMapOpacity(baseMapOpacity) {
  return {
    type: SET_BASE_MAP_OPACITY,
    baseMapOpacity
  };
}

export const SET_NAVIGATION_CONTROL = 'SET_NAVIGATION_CONTROL';
export function setNavigationControl(navigationControl) {
  return {
    type: SET_NAVIGATION_CONTROL,
    navigationControl
  };
}

export const SET_GEO_CODER_CONTROL = 'SET_GEO_CODER_CONTROL';
export function setGeoCoderControl(geoCoderControl) {
  return {
    type: SET_GEO_CODER_CONTROL,
    geoCoderControl
  };
}

export const SET_GEO_LOCATE_CONTROL = 'SET_GEO_LOCATE_CONTROL';
export function setGeoLocateControl(geoLocateControl) {
  return {
    type: SET_GEO_LOCATE_CONTROL,
    geoLocateControl
  };
}

export const SET_MAP_FLYOUT_TITLE_COLUMN_NAME = 'SET_MAP_FLYOUT_TITLE_COLUMN_NAME';
export function setMapFlyoutTitleColumnName(mapFlyoutTitleColumnName) {
  return {
    type: SET_MAP_FLYOUT_TITLE_COLUMN_NAME,
    mapFlyoutTitleColumnName
  };
}

export const ADD_BASEMAP_FLYOUT_COLUMN = 'ADD_BASEMAP_FLYOUT_COLUMN';
export function addBasemapFlyoutColumn(columnName) {
  return {
    type: ADD_BASEMAP_FLYOUT_COLUMN,
    columnName
  };
}

export const REMOVE_BASEMAP_FLYOUT_COLUMN = 'REMOVE_BASEMAP_FLYOUT_COLUMN';
export function removeBasemapFlyoutColumn(relativeIndex) {
  return {
    type: REMOVE_BASEMAP_FLYOUT_COLUMN,
    relativeIndex
  };
}

export const CHANGE_ADDITIONAL_FLYOUT_COLUMN = 'CHANGE_ADDITIONAL_FLYOUT_COLUMN';
export function changeAdditionalFlyoutColumn(columnName, relativeIndex) {
  return {
    type: CHANGE_ADDITIONAL_FLYOUT_COLUMN,
    columnName,
    relativeIndex
  };
}

export const SET_ADDITIONAL_FLYOUT_COLUMNS = 'SET_ADDITIONAL_FLYOUT_COLUMNS';
export function setAdditionalFlyoutColumns(columns) {
  return {
    type: SET_ADDITIONAL_FLYOUT_COLUMNS,
    columns
  };
}

export const SET_SEARCH_BOUNDARY_UPPER_LEFT_LATITUDE = 'SET_SEARCH_BOUNDARY_UPPER_LEFT_LATITUDE';
export function setSearchBoundaryUpperLeftLatitude(searchBoundaryUpperLeftLatitude) {
  return {
    type: SET_SEARCH_BOUNDARY_UPPER_LEFT_LATITUDE,
    searchBoundaryUpperLeftLatitude
  };
}

export const SET_SEARCH_BOUNDARY_UPPER_LEFT_LONGITUDE = 'SET_SEARCH_BOUNDARY_UPPER_LEFT_LONGITUDE';
export function setSearchBoundaryUpperLeftLongitude(searchBoundaryUpperLeftLongitude) {
  return {
    type: SET_SEARCH_BOUNDARY_UPPER_LEFT_LONGITUDE,
    searchBoundaryUpperLeftLongitude
  };
}

export const SET_SEARCH_BOUNDARY_LOWER_RIGHT_LATITUDE = 'SET_SEARCH_BOUNDARY_LOWER_RIGHT_LATITUDE';
export function setSearchBoundaryLowerRightLatitude(searchBoundaryLowerRightLatitude) {
  return {
    type: SET_SEARCH_BOUNDARY_LOWER_RIGHT_LATITUDE,
    searchBoundaryLowerRightLatitude
  };
}

export const SET_SEARCH_BOUNDARY_LOWER_RIGHT_LONGITUDE = 'SET_SEARCH_BOUNDARY_LOWER_RIGHT_LONGITUDE';
export function setSearchBoundaryLowerRightLongitude(searchBoundaryLowerRightLongitude) {
  return {
    type: SET_SEARCH_BOUNDARY_LOWER_RIGHT_LONGITUDE,
    searchBoundaryLowerRightLongitude
  };
}

export const SET_PITCH_AND_BEARING = 'SET_PITCH_AND_BEARING';
export function setPitchAndBearing(pitchAndBearing) {
  return {
    type: SET_PITCH_AND_BEARING,
    pitchAndBearing
  };
}

export const SET_SHAPE_FILL_COLOR = 'SET_SHAPE_FILL_COLOR';
export function setShapeFillColor(shapeFillColor) {
  return {
    type: SET_SHAPE_FILL_COLOR,
    shapeFillColor
  };
}

export const SET_SHAPE_FILL_OPACITY = 'SET_SHAPE_FILL_OPACITY';
export function setShapeFillOpacity(shapeFillOpacity) {
  return {
    type: SET_SHAPE_FILL_OPACITY,
    shapeFillOpacity
  };
}

export const SET_SHAPE_OUTLINE_COLOR = 'SET_SHAPE_OUTLINE_COLOR';
export function setShapeOutlineColor(shapeOutlineColor) {
  return {
    type: SET_SHAPE_OUTLINE_COLOR,
    shapeOutlineColor
  };
}

export const SET_SHAPE_OUTLINE_WIDTH = 'SET_SHAPE_OUTLINE_WIDTH';
export function setShapeOutlineWidth(shapeOutlineWidth) {
  return {
    type: SET_SHAPE_OUTLINE_WIDTH,
    shapeOutlineWidth
  };
}
