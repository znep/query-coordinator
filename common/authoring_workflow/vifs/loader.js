import _ from 'lodash';
import * as actions from '../actions';
import { SERIES_TYPE_FLYOUT } from '../constants';

/**
 * Note: These properties are in alphabetical order.
 */
const paths = {
  additionalFlyoutColumns: 'series[0].mapOptions.additionalFlyoutColumns',
  baseLayerOpacity: 'configuration.baseLayerOpacity',
  baseLayerUrl: 'configuration.baseLayerUrl',
  baseMapStyle: 'configuration.baseMapStyle',
  baseMapOpacity: 'configuration.baseMapOpacity',
  clusterRadius: 'series[0].mapOptions.clusterRadius',
  colorBoundariesBy: 'series[0].mapOptions.colorBoundariesBy',
  colorLinesBy: 'series[0].mapOptions.colorLinesBy',
  colorPalette: 'series[0].color.palette',
  colorPointsBy: 'series[0].mapOptions.colorPointsBy',
  computedColumnName: 'configuration.computedColumnName',
  customColorPalette: 'series[0].color.customPalette',
  datasetUid: 'series[0].dataSource.datasetUid',
  description: 'description',
  dimensionColumnName: 'series[0].dataSource.dimension.columnName',
  dimensionGroupingColumnName: 'series[0].dataSource.dimension.grouping.columnName',
  dimensionLabelAreaSize: 'configuration.dimensionLabelAreaSize',
  domain: 'series[0].dataSource.domain',
  errorBarsBarColor: 'series[0].errorBars.barColor',
  errorBarsLowerBoundColumnName: 'series[0].errorBars.lowerBoundColumnName',
  errorBarsUpperBoundColumnName: 'series[0].errorBars.upperBoundColumnName',
  geoCoderControl: 'configuration.geoCoderControl',
  geoLocateControl: 'configuration.geoLocateControl',
  labelBottom: 'configuration.axisLabels.bottom',
  labelLeft: 'configuration.axisLabels.left',
  labelRight: 'configuration.axisLabels.right',
  labelTop: 'configuration.axisLabels.top',
  limit: 'series[0].dataSource.limit',
  lineWeight: 'series[0].mapOptions.lineWeight',
  mapCenterAndZoom: 'configuration.mapCenterAndZoom',
  mapFlyoutTitleColumnName: 'series[0].mapOptions.mapFlyoutTitleColumnName',
  mapType: 'series[0].mapOptions.mapType',
  maxClusteringZoomLevel: 'series[0].mapOptions.maxClusteringZoomLevel',
  maxClusterSize: 'series[0].mapOptions.maxClusterSize',
  maximumLineWeight: 'series[0].mapOptions.maximumLineWeight',
  maximumPointSize: 'series[0].mapOptions.maximumPointSize',
  measureAggregationFunction: 'series[{0}].dataSource.measure.aggregationFunction',
  measureAxisMaxValue: 'configuration.measureAxisMaxValue',
  measureAxisMinValue: 'configuration.measureAxisMinValue',
  measureColumnName: 'series[{0}].dataSource.measure.columnName',
  minimumLineWeight: 'series[0].mapOptions.minimumLineWeight',
  minimumPointSize: 'series[0].mapOptions.minimumPointSize',
  navigationControl: 'configuration.navigationControl',
  negativeColor: 'configuration.legend.negativeColor',
  numberOfDataClasses: 'series[0].mapOptions.numberOfDataClasses',
  orderBy: 'series[0].dataSource.orderBy',
  pointOpacity: 'configuration.pointOpacity',
  pointAggregation: 'series[0].mapOptions.pointAggregation',
  pointSize: 'configuration.pointSize',
  pointMapPointSize: 'series[0].mapOptions.pointMapPointSize',
  pointThreshold: 'series[0].mapOptions.pointThreshold',
  positiveColor: 'configuration.legend.positiveColor',
  precision: 'series[0].dataSource.precision',
  primaryColor: 'series[{0}].color.primary',
  quantificationMethod: 'series[0].mapOptions.quantificationMethod',
  referenceLineColor: 'referenceLines[{0}].color',
  referenceLineLabel: 'referenceLines[{0}].label',
  referenceLines: 'referenceLines',
  referenceLineValue: 'referenceLines[{0}].value',
  resizePointsBy: 'series[0].mapOptions.resizePointsBy',
  rowInspectorTitleColumnName: 'configuration.rowInspectorTitleColumnName',
  secondaryColor: 'series[{0}].color.secondary',
  secondaryMeasureAxisMaxValue: 'configuration.secondaryMeasureAxisMaxValue',
  secondaryMeasureAxisMinValue: 'configuration.secondaryMeasureAxisMinValue',
  searchBoundaryLowerRightLatitude: 'series[0].mapOptions.searchBoundaryLowerRightLatitude',
  searchBoundaryLowerRightLongitude: 'series[0].mapOptions.searchBoundaryLowerRightLongitude',
  searchBoundaryUpperLeftLatitude: 'series[0].mapOptions.searchBoundaryUpperLeftLatitude',
  searchBoundaryUpperLeftLongitude: 'series[0].mapOptions.searchBoundaryUpperLeftLongitude',
  series: 'series',
  seriesType: 'series[{0}].type',
  shapefileGeometryLabel: 'configuration.shapefile.geometryLabel',
  shapefilePrimaryKey: 'configuration.shapefile.primaryKey',
  shapefileUid: 'configuration.shapefile.uid',
  showDimensionLabels: 'configuration.showDimensionLabels',
  showOtherCategory: 'configuration.showOtherCategory',
  showValueLabels: 'configuration.showValueLabels',
  showValueLabelsAsPercent: 'configuration.showValueLabelsAsPercent',
  showLegend: 'configuration.showLegend',
  stacked: 'series[0].stacked',
  stackRadius: 'series[0].mapOptions.stackRadius',
  stackedOneHundredPercent: 'series[0].stacked.oneHundredPercent',
  title: 'title',
  treatNullValuesAsZero: 'configuration.treatNullValuesAsZero',
  unitOne: 'series[{0}].unit.one',
  unitOther: 'series[{0}].unit.other',
  useSecondaryAxisForColumns: 'configuration.useSecondaryAxisForColumns',
  useSecondaryAxisForLines: 'configuration.useSecondaryAxisForLines',
  viewSourceDataLink: 'configuration.viewSourceDataLink',
  visualizationType: 'series[0].type',
  weighLinesBy: 'series[0].mapOptions.weighLinesBy',
  zeroColor: 'configuration.legend.zeroColor'
};

const hasVifPath = (vif) => (path) => _.has(vif, path);
const getVifPath = (vif) => (path) => _.get(vif, path, null);

/**
 * load() communicates to the redux store the individual
 * pieces of any VIF it encounters and attempts to create
 * actions. These actions are then processed by each VIF reducer and
 * applied to its configuration (if relevant).
 *
 * Loading also includes kicking off the dataSource HTTP requests
 * that grab dataset metadata.
 */
export const load = (dispatch, vif) => {
  const has = hasVifPath(vif);
  const get = getVifPath(vif);

  if (has(paths.series)) {

    const seriesCount = get(paths.series).length;
    let flyoutSeriesIndex = 0;

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {

      const seriesTypePath = paths.seriesType.format(seriesIndex);
      let seriesVariant;
      let seriesType;

      if (has(seriesTypePath)) {
        seriesType = get(paths.seriesType.format(seriesIndex));
        const parts = seriesType.split('.');

        if (parts.length > 1) {
          seriesVariant = parts[1];
        }
      }

      const isFlyoutSeries = seriesType === SERIES_TYPE_FLYOUT;

      if (seriesIndex > 0) { // the first series already exists in the vif templates, no need to create it.

        dispatch(actions.appendSeries({
          isFlyoutSeries,
          isInitialLoad: true,
          seriesIndex,
          seriesVariant
        }));

      } else {

        // At present this only affects combo chart whose series type at index 0 could be,
        // comboChart.column or comboChart.line.  It defaults to comboChart.column so we need to
        // explicitly set the variant it to the vif value.
        if (!_.isNil(seriesVariant)) {
          dispatch(actions.setSeriesVariant(seriesIndex, seriesVariant));
        }
      }

      const measureColumnNamePath = paths.measureColumnName.format(seriesIndex);
      if (has(measureColumnNamePath)) {
        dispatch(actions.setMeasureColumn({
          columnName: get(measureColumnNamePath),
          isFlyoutSeries,
          relativeIndex: isFlyoutSeries ? flyoutSeriesIndex : seriesIndex
        }));
      }

      const measureAggregationFunctionPath = paths.measureAggregationFunction.format(seriesIndex);
      if (has(measureAggregationFunctionPath)) {
        dispatch(actions.setMeasureAggregation({
          aggregationFunction: get(measureAggregationFunctionPath),
          isFlyoutSeries,
          relativeIndex: isFlyoutSeries ? flyoutSeriesIndex : seriesIndex
        }));
      }

      const primaryColorPath = paths.primaryColor.format(seriesIndex);
      if (has(primaryColorPath)) {
        dispatch(actions.setPrimaryColor(seriesIndex, get(primaryColorPath)));
      }

      const secondaryColorPath = paths.secondaryColor.format(seriesIndex);
      if (has(secondaryColorPath)) {
        dispatch(actions.setSecondaryColor(seriesIndex, get(secondaryColorPath)));
      }

      const unitOnePath = paths.unitOne.format(seriesIndex);
      if (has(unitOnePath)) {
        dispatch(actions.setUnitsOne(seriesIndex, get(unitOnePath)));
      }

      const unitOtherPath = paths.unitOther.format(seriesIndex);
      if (has(unitOtherPath)) {
        dispatch(actions.setUnitsOther(seriesIndex, get(unitOtherPath)));
      }

      if (isFlyoutSeries) {
        flyoutSeriesIndex++;
      }
    }
  }

  if (has(paths.referenceLines)) {

    const referenceLinesCount = get(paths.referenceLines).length;

    for (let i = 0; i < referenceLinesCount; i++) {
      dispatch(actions.appendReferenceLine());

      const referenceLineColorPath = paths.referenceLineColor.format(i);
      if (has(referenceLineColorPath)) {
        dispatch(actions.setReferenceLineColor({ referenceLineIndex: i, color: get(referenceLineColorPath) }));
      }

      const referenceLineLabelPath = paths.referenceLineLabel.format(i);
      if (has(referenceLineLabelPath)) {
        dispatch(actions.setReferenceLineLabel({ referenceLineIndex: i, label: get(referenceLineLabelPath) }));
      }

      const referenceLineValuePath = paths.referenceLineValue.format(i);
      if (has(referenceLineValuePath)) {
        dispatch(actions.setReferenceLineValue({ referenceLineIndex: i, value: get(referenceLineValuePath) }));
      }
    }
  }

  if (has(paths.additionalFlyoutColumns)) {
    dispatch(actions.setAdditionalFlyoutColumns(get(paths.additionalFlyoutColumns)));
  }

  if (has(paths.baseLayerOpacity)) {
    dispatch(actions.setBaseLayerOpacity(get(paths.baseLayerOpacity)));
  }

  if (has(paths.baseLayerUrl)) {
    dispatch(actions.setBaseLayer(get(paths.baseLayerUrl)));
  }

  if (has(paths.computedColumnName)) {
    dispatch(actions.setComputedColumn(get(paths.computedColumnName)));
  }

  if (has(paths.description)) {
    dispatch(actions.setDescription(get(paths.description)));
  }

  if (has(paths.dimensionColumnName)) {
    dispatch(actions.setDimension(get(paths.dimensionColumnName)));
  }

  if (has(paths.dimensionGroupingColumnName)) {
    dispatch(actions.setDimensionGroupingColumnName(get(paths.dimensionGroupingColumnName)));
  }

  if (has(paths.errorBarsBarColor)) {
    dispatch(actions.setErrorBarsBarColor(get(paths.errorBarsBarColor)));
  }

  if (has(paths.errorBarsLowerBoundColumnName)) {
    dispatch(actions.setErrorBarsLowerBoundColumnName(get(paths.errorBarsLowerBoundColumnName)));
  }

  if (has(paths.errorBarsUpperBoundColumnName)) {
    dispatch(actions.setErrorBarsUpperBoundColumnName(get(paths.errorBarsUpperBoundColumnName)));
  }

  if (has(paths.customColorPalette)) {
    const columnName = has(paths.dimensionGroupingColumnName) ?
      get(paths.dimensionGroupingColumnName) :
      get(paths.dimensionColumnName);

    dispatch(actions.setCustomColorPalette(
      get(paths.customColorPalette)[columnName],
      columnName
    ));
  }

  if (has(paths.colorPalette)) {
    dispatch(actions.setColorPalette(get(paths.colorPalette)));
  }

  if (has(paths.labelBottom)) {
    dispatch(actions.setLabelBottom(get(paths.labelBottom)));
  }

  if (has(paths.labelLeft)) {
    dispatch(actions.setLabelLeft(get(paths.labelLeft)));
  }

  if (has(paths.labelRight)) {
    dispatch(actions.setLabelRight(get(paths.labelRight)));
  }

  if (has(paths.labelTop)) {
    dispatch(actions.setLabelTop(get(paths.labelTop)));
  }

  if (has(paths.dimensionLabelAreaSize)) {
    dispatch(actions.setDimensionLabelAreaSize(get(paths.dimensionLabelAreaSize)));
  }

  if (has(paths.limit)) {
    if (has(paths.showOtherCategory)) {
      dispatch(actions.setLimitCountAndShowOtherCategory(get(paths.limit), get(paths.showOtherCategory)));
    } else {
      dispatch(actions.setLimitCountAndShowOtherCategory(get(paths.limit), false));
    }
  } else if (has(paths.showOtherCategory)) {
    dispatch(actions.setShowOtherCategory(get(paths.showOtherCategory)));
  }

  if (has(paths.mapCenterAndZoom)) {
    dispatch(actions.setCenterAndZoom(get(paths.mapCenterAndZoom)));
  }

  if (has(paths.mapFlyoutTitleColumnName)) {
    dispatch(actions.setMapFlyoutTitleColumnName(get(paths.mapFlyoutTitleColumnName)));
  }

  if (has(paths.measureAxisMaxValue)) {
    dispatch(actions.setMeasureAxisMaxValue(get(paths.measureAxisMaxValue)));
  }

  if (has(paths.measureAxisMinValue)) {
    dispatch(actions.setMeasureAxisMinValue(get(paths.measureAxisMinValue)));
  }

  if (has(paths.secondaryMeasureAxisMaxValue)) {
    dispatch(actions.setSecondaryMeasureAxisMaxValue(get(paths.secondaryMeasureAxisMaxValue)));
  }

  if (has(paths.secondaryMeasureAxisMinValue)) {
    dispatch(actions.setSecondaryMeasureAxisMinValue(get(paths.secondaryMeasureAxisMinValue)));
  }
  if (has(paths.negativeColor)) {
    dispatch(actions.setNegativeColor(get(paths.negativeColor)));
  }

  if (has(paths.orderBy)) {
    dispatch(actions.setOrderBy(get(paths.orderBy)));
  }

  if (has(paths.positiveColor)) {
    dispatch(actions.setPositiveColor(get(paths.positiveColor)));
  }

  if (has(paths.precision)) {
    dispatch(actions.setPrecision(get(paths.precision)));
  }

  if (has(paths.rowInspectorTitleColumnName)) {
    dispatch(actions.setRowInspectorTitleColumnName(get(paths.rowInspectorTitleColumnName)));
  }

  if (has(paths.shapefileGeometryLabel)) {
    dispatch(actions.setShapefileGeometryLabel(get(paths.shapefileGeometryLabel)));
  }

  if (has(paths.shapefilePrimaryKey)) {
    dispatch(actions.setShapefilePrimaryKey(get(paths.shapefilePrimaryKey)));
  }

  if (has(paths.shapefileUid)) {
    dispatch(actions.setShapefileUid(get(paths.shapefileUid)));
  }

  if (has(paths.showDimensionLabels)) {
    dispatch(actions.setShowDimensionLabels(get(paths.showDimensionLabels)));
  }

  if (has(paths.showValueLabels)) {
    dispatch(actions.setShowValueLabels(get(paths.showValueLabels)));
  }

  if (has(paths.showValueLabelsAsPercent)) {
    dispatch(actions.setShowValueLabelsAsPercent(get(paths.showValueLabelsAsPercent)));
  }

  if (has(paths.showLegend)) {
    dispatch(actions.setShowLegend(get(paths.showLegend)));
  }

  if (has(paths.stackedOneHundredPercent)) {
    dispatch(actions.setStacked({ stacked: true, oneHundredPercent: get(paths.stackedOneHundredPercent) }));
  } else if (has(paths.stacked)) {
    dispatch(actions.setStacked({ stacked: true, oneHundredPercent: false }));
  }

  if (has(paths.title)) {
    dispatch(actions.setTitle(get(paths.title)));
  }

  if (has(paths.treatNullValuesAsZero)) {
    dispatch(actions.setTreatNullValuesAsZero(get(paths.treatNullValuesAsZero)));
  }

  if (has(paths.useSecondaryAxisForColumns)) {
    dispatch(actions.setUseSecondaryAxisForColumns(get(paths.useSecondaryAxisForColumns)));
  }

  if (has(paths.useSecondaryAxisForLines)) {
    dispatch(actions.setUseSecondaryAxisForLines(get(paths.useSecondaryAxisForLines)));
  }

  if (has(paths.viewSourceDataLink)) {
    dispatch(actions.setViewSourceDataLink(get(paths.viewSourceDataLink)));
  }

  if (has(paths.visualizationType)) {
    const visualizationType = get(paths.visualizationType);
    const parts = (visualizationType || '').split('.');
    const type = (parts.length > 0) ? parts[0] : visualizationType;

    dispatch(actions.setVisualizationType(type));
  }

  if (has(paths.zeroColor)) {
    dispatch(actions.setZeroColor(get(paths.zeroColor)));
  }

  if (has(paths.mapType)) {
    dispatch(actions.setMapType(get(paths.mapType)));
  }

  if (has(paths.pointSize)) {
    dispatch(actions.setPointSize(get(paths.pointSize)));
  }

  if (has(paths.pointMapPointSize)) {
    dispatch(actions.setPointMapPointSize(get(paths.pointMapPointSize)));
  }

  if (has(paths.pointOpacity)) {
    dispatch(actions.setPointOpacity(get(paths.pointOpacity)));
  }

  if (has(paths.resizePointsBy)) {
    dispatch(actions.setPointSizeByColumn(get(paths.resizePointsBy)));
  }

  if (has(paths.minimumPointSize)) {
    dispatch(actions.setMinimumPointSize(get(paths.minimumPointSize)));
  }

  if (has(paths.maximumPointSize)) {
    dispatch(actions.setMaximumPointSize(get(paths.maximumPointSize)));
  }

  if (has(paths.numberOfDataClasses)) {
    dispatch(actions.setNumberOfDataClasses(get(paths.numberOfDataClasses)));
  }

  if (has(paths.maxClusteringZoomLevel)) {
    dispatch(actions.setMaxClusteringZoomLevel(get(paths.maxClusteringZoomLevel)));
  }

  if (has(paths.pointThreshold)) {
    dispatch(actions.setPointThreshold(get(paths.pointThreshold)));
  }

  if (has(paths.clusterRadius)) {
    dispatch(actions.setClusterRadius(get(paths.clusterRadius)));
  }

  if (has(paths.maxClusterSize)) {
    dispatch(actions.setMaxClusterSize(get(paths.maxClusterSize)));
  }

  if (has(paths.stackRadius)) {
    dispatch(actions.setStackRadius(get(paths.stackRadius)));
  }

  if (has(paths.quantificationMethod)) {
    dispatch(actions.setQuantificationMethod(get(paths.quantificationMethod)));
  }

  if (has(paths.colorPointsBy)) {
    dispatch(actions.setPointColorByColumn(get(paths.colorPointsBy)));
  }

  if (has(paths.lineWeight)) {
    dispatch(actions.setLineWeight(get(paths.lineWeight)));
  }

  if (has(paths.navigationControl)) {
    dispatch(actions.setNavigationControl(get(paths.navigationControl)));
  }

  if (has(paths.geoCoderControl)) {
    dispatch(actions.setGeoCoderControl(get(paths.geoCoderControl)));
  }

  if (has(paths.geoLocateControl)) {
    dispatch(actions.setGeoLocateControl(get(paths.geoLocateControl)));
  }

  if (has(paths.searchBoundaryLowerRightLatitude)) {
    dispatch(actions.setSearchBoundaryLowerRightLatitude(get(paths.searchBoundaryLowerRightLatitude)));
  }

  if (has(paths.searchBoundaryLowerRightLongitude)) {
    dispatch(actions.setSearchBoundaryLowerRightLongitude(get(paths.searchBoundaryLowerRightLongitude)));
  }

  if (has(paths.searchBoundaryUpperLeftLatitude)) {
    dispatch(actions.setSearchBoundaryUpperLeftLatitude(get(paths.searchBoundaryUpperLeftLatitude)));
  }

  if (has(paths.searchBoundaryUpperLeftLongitude)) {
    dispatch(actions.setSearchBoundaryUpperLeftLongitude(get(paths.searchBoundaryUpperLeftLongitude)));
  }

  if (has(paths.weighLinesBy)) {
    dispatch(actions.setLineWeightByColumn(get(paths.weighLinesBy)));
  }

  if (has(paths.minimumLineWeight)) {
    dispatch(actions.setMinimumLineWeight(get(paths.minimumLineWeight)));
  }

  if (has(paths.maximumLineWeight)) {
    dispatch(actions.setMaximumLineWeight(get(paths.maximumLineWeight)));
  }

  if (has(paths.colorLinesBy)) {
    dispatch(actions.setLineColorByColumn(get(paths.colorLinesBy)));
  }

  if (has(paths.colorBoundariesBy)) {
    dispatch(actions.setBoundaryColorByColumn(get(paths.colorBoundariesBy)));
  }

  if (has(paths.pointAggregation)) {
    dispatch(actions.setPointAggregation(get(paths.pointAggregation)));
  }

  if (has(paths.baseMapStyle)) {
    dispatch(actions.setBaseMapStyle(get(paths.baseMapStyle)));
  }

  if (has(paths.baseMapOpacity)) {
    dispatch(actions.setBaseMapOpacity(get(paths.baseMapOpacity)));
  }

  dispatch(actions.setDatasetUid(get(paths.datasetUid)));
  dispatch(actions.setDomain(get(paths.domain)));
  dispatch(actions.setDataSource(get(paths.domain), get(paths.datasetUid)));
  dispatch(actions.setCuratedRegions(get(paths.domain), get(paths.datasetUid)));
};
