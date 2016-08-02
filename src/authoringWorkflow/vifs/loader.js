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
  labelBottom: 'configuration.axisLabels.bottom',
  labelLeft: 'configuration.axisLabels.left',
  measureAggregationFunction: 'series[0].dataSource.measure.aggregationFunction',
  measureColumnName: 'series[0].dataSource.measure.columnName',
  negativeColor: 'configuration.legend.negativeColor',
  positiveColor: 'configuration.legend.positiveColor',
  pointOpacity: 'configuration.pointOpacity',
  primaryColor: 'series[0].color.primary',
  rowInspectorTitleColumnName: 'configuration.rowInspectorTitleColumnName',
  secondaryColor: 'series[0].color.secondary',
  shapefileGeometryLabel: 'configuration.shapefile.geometryLabel',
  shapefilePrimaryKey: 'configuration.shapefile.primaryKey',
  shapefileUid: 'configuration.shapefile.uid',
  title: 'title',
  unitOne: 'series[0].unit.one',
  unitOther: 'series[0].unit.other',
  visualizationType: 'series[0].type',
  zeroColor: 'configuration.legend.zeroColor'
};

const hasVifPath = (vif) => (path) => _.has(vif, path);
const getVifPath = (vif) => (path) => _.get(vif, path);

export var load = (dispatch, vif) => {
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

  if (has(paths.labelBottom)) {
    dispatch(actions.setLabelBottom(get(paths.labelBottom)));
  }

  if (has(paths.labelLeft)) {
    dispatch(actions.setLabelLeft(get(paths.labelLeft)));
  }

  if (has(paths.measureAggregationFunction)) {
    dispatch(actions.setMeasureAggregation(get(paths.measureAggregationFunction)));
  }

  if (has(paths.measureColumnName)) {
    dispatch(actions.setMeasure(get(paths.measureColumnName)));
  }

  if(has(get(paths.negativeColor))) {
    dispatch(actions.setNegativeColor(get(paths.negativeColor)));
  }

  if (has(paths.pointOpacity)) {
    dispatch(actions.setPointOpacity(get(paths.pointOpacity)));
  }

  if (has(get(paths.positiveColor))) {
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

  if (has(paths.visualizationType)) {
    dispatch(actions.setVisualizationType(get(paths.visualizationType)));
  }

  if(has(get(paths.zeroColor))) {
    dispatch(actions.setZeroColor(get(paths.zeroColor)));
  }

  dispatch(
    actions.setShapefile(
      get(paths.shapefileUid),
      get(paths.shapefilePrimaryKey),
      get(paths.shapefileGeometryLabel)
    )
  );

  dispatch(actions.setDatasetUid(get(paths.datasetUid)));
  dispatch(actions.setDomain(get(paths.domain)));
  dispatch(actions.setDataSource(get(paths.domain), get(paths.datasetUid)));
};
