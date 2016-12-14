import _ from 'lodash';
import * as actions from '../actions';

const paths = {
  baseLayerOpacity: 'configuration.baseLayerOpacity',
  baseLayerUrl: 'configuration.baseLayerUrl',
  computedColumnName: 'configuration.computedColumnName',
  datasetUid: 'series[0].dataSource.datasetUid',
  description: 'description',
  dimensionColumnName: 'series[0].dataSource.dimension.columnName',
  domain: 'series[0].dataSource.domain',
  labelTop: 'configuration.axisLabels.top',
  labelBottom: 'configuration.axisLabels.bottom',
  labelLeft: 'configuration.axisLabels.left',
  mapCenterAndZoom: 'configuration.mapCenterAndZoom',
  measureAggregationFunction: 'series[0].dataSource.measure.aggregationFunction',
  measureColumnName: 'series[0].dataSource.measure.columnName',
  negativeColor: 'configuration.legend.negativeColor',
  positiveColor: 'configuration.legend.positiveColor',
  pointOpacity: 'configuration.pointOpacity',
  pointSize: 'configuration.pointSize',
  primaryColor: 'series[0].color.primary',
  rowInspectorTitleColumnName: 'configuration.rowInspectorTitleColumnName',
  secondaryColor: 'series[0].color.secondary',
  shapefileGeometryLabel: 'configuration.shapefile.geometryLabel',
  shapefilePrimaryKey: 'configuration.shapefile.primaryKey',
  shapefileUid: 'configuration.shapefile.uid',
  title: 'title',
  unitOne: 'series[0].unit.one',
  unitOther: 'series[0].unit.other',
  viewSourceDataLink: 'configuration.viewSourceDataLink',
  visualizationType: 'series[0].type',
  showDimensionLabels: 'configuration.showDimensionLabels',
  showValueLabels: 'configuration.showValueLabels',
  showValueLabelsAsPercent: 'configuration.showValueLabelsAsPercent',
  zeroColor: 'configuration.legend.zeroColor',
  precision: 'series[0].dataSource.precision',
  treatNullValuesAsZero: 'configuration.treatNullValuesAsZero',
  measureAxisMinValue: 'configuration.measureAxisMinValue',
  measureAxisMaxValue: 'configuration.measureAxisMaxValue',
  orderBy: 'series[0].dataSource.orderBy',
  limit: 'series[0].dataSource.limit',
  showOtherCategory: 'configuration.showOtherCategory'
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

  if (has(paths.labelTop)) {
    dispatch(actions.setLabelTop(get(paths.labelTop)));
  }

  if (has(paths.labelBottom)) {
    dispatch(actions.setLabelBottom(get(paths.labelBottom)));
  }

  if (has(paths.labelLeft)) {
    dispatch(actions.setLabelLeft(get(paths.labelLeft)));
  }

  if (has(paths.mapCenterAndZoom)) {
    dispatch(actions.setCenterAndZoom(get(paths.mapCenterAndZoom)));
  }

  if (has(paths.measureAggregationFunction)) {
    dispatch(actions.setMeasureAggregation(get(paths.measureAggregationFunction)));
  }

  if (has(paths.measureColumnName)) {
    dispatch(actions.setMeasure(get(paths.measureColumnName)));
  }

  if (has(paths.negativeColor)) {
    dispatch(actions.setNegativeColor(get(paths.negativeColor)));
  }

  if (has(paths.orderBy)) {
    dispatch(actions.setOrderBy(get(paths.orderBy)));
  }

  if (has(paths.pointOpacity)) {
    dispatch(actions.setPointOpacity(get(paths.pointOpacity)));
  }

  if (has(paths.pointSize)) {
    dispatch(actions.setPointSize(get(paths.pointSize)));
  }

  if (has(paths.positiveColor)) {
    dispatch(actions.setPositiveColor(get(paths.positiveColor)));
  }

  if (has(paths.primaryColor)) {
    dispatch(actions.setPrimaryColor(get(paths.primaryColor)));
  }

  if (has(paths.rowInspectorTitleColumnName)) {
    dispatch(actions.setRowInspectorTitleColumnName(get(paths.rowInspectorTitleColumnName)));
  }

  if (has(paths.secondaryColor)) {
    dispatch(actions.setSecondaryColor(get(paths.secondaryColor)));
  }

  if (has(paths.title)) {
    dispatch(actions.setTitle(get(paths.title)));
  }

  if (has(paths.unitOne)) {
    dispatch(actions.setUnitsOne(get(paths.unitOne)));
  }

  if (has(paths.unitOther)) {
    dispatch(actions.setUnitsOther(get(paths.unitOther)));
  }

  if (has(paths.viewSourceDataLink)) {
    dispatch(actions.setViewSourceDataLink(get(paths.viewSourceDataLink)));
  }

  if (has(paths.visualizationType)) {
    dispatch(actions.setVisualizationType(get(paths.visualizationType)));
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

  if (has(paths.zeroColor)) {
    dispatch(actions.setZeroColor(get(paths.zeroColor)));
  }

  if (has(paths.precision)) {
    dispatch(actions.setPrecision(get(paths.precision)));
  }

  if (has(paths.treatNullValuesAsZero)) {
    dispatch(actions.setTreatNullValuesAsZero(get(paths.treatNullValuesAsZero)));
  }

  if (has(paths.measureAxisMinValue)) {
    dispatch(actions.setMeasureAxisMinValue(get(paths.measureAxisMinValue)));
  }

  if (has(paths.measureAxisMaxValue)) {
    dispatch(actions.setMeasureAxisMaxValue(get(paths.measureAxisMaxValue)));
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

  if (has(paths.shapefileUid)) {
    dispatch(actions.setShapefileUid(get(paths.shapefileUid)));
  }

  if (has(paths.shapefilePrimaryKey)) {
    dispatch(actions.setShapefilePrimaryKey(get(paths.shapefilePrimaryKey)));
  }

  if (has(paths.shapefileGeometryLabel)) {
    dispatch(actions.setShapefileGeometryLabel(get(paths.shapefileGeometryLabel)));
  }

  dispatch(actions.setDatasetUid(get(paths.datasetUid)));
  dispatch(actions.setDomain(get(paths.domain)));
  dispatch(actions.setDataSource(get(paths.domain), get(paths.datasetUid)));
};