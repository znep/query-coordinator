import _ from 'lodash';

import * as actions from '../actions';

const paths = {
  baseLayerOpacity: 'configuration.baseLayerOpacity',
  baseLayerUrl: 'configuration.baseLayerUrl',
  computedColumnName: 'configuration.computedColumnName',
  datasetUid: 'series[0].dataSource.datasetUid',
  description: 'description',
  dimensionColumnName: 'series[0].dataSource.domain.columnName',
  domain: 'series[0].dataSource.domain',
  measureAggregationFunction: 'series[0].dataSource.measure.aggregationFunction',
  measureColumnName: 'series[0].dataSource.measure.columnName',
  negativeColor: 'configuration.legend.negativeColor',
  positiveColor: 'configuration.legend.positiveColor',
  primaryColor: 'series[0].color.primary',
  rowInspectorTitleColumnName: 'configuration.rowInspectorTitleColumnName',
  secondaryColor: 'series[0].color.secondary',
  shapefileGeometryLabel: 'configuration.shapefile.geometryLabel',
  shapefilePrimaryKey: 'configuration.shapefile.primaryKey',
  shapefileUid: 'configuration.shapefile.uid',
  title: 'title',
  visualizationType: 'series[0].type',
  xAxisScalingMode: 'configuration.xAxisScalingMode',
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

  if (has(paths.measureAggregationFunction)) {
    dispatch(actions.setMeasureAggregation(get(paths.measureAggregationFunction)));
  }

  if (has(paths.measureColumnName)) {
    dispatch(actions.setMeasure(get(paths.measureColumnName)));
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

  if (has(paths.visualizationType)) {
    dispatch(actions.setVisualizationType(get(paths.visualizationType)));
  }

  if (has(paths.xAxisScalingMode)) {
    dispatch(actions.setXAxisScalingMode(get(paths.xAxisScalingMode)));
  }

  dispatch(
    actions.setShapefile(
      get(paths.shapefileUid),
      get(paths.shapefilePrimaryKey),
      get(paths.shapefileGeometryLabel)
    )
  );

  dispatch(
    actions.setColorScale(
      get(paths.negativeColor),
      get(paths.zeroColor),
      get(paths.positiveColor)
    )
  );

  dispatch(
    actions.setDataSource(
      get(paths.domain),
      get(paths.datasetUid)
    )
  );
};
