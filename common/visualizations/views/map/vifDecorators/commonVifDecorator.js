import _ from 'lodash';

import { COLOR_PALETTE_VALUES } from 'common/authoring_workflow/constants';

export function getDomain() {
  return _.get(this, 'series[0].dataSource.domain');
}

export function getDatasetUid() {
  return _.get(this, 'series[0].dataSource.datasetUid');
}

export function getColumnName() {
  return _.get(this, 'series[0].dataSource.dimension.columnName');
}

export function getColorPalleteId() {
  return _.get(this, 'series[0].color.palette');
}

export function getColorPallete() {
  return _.get(COLOR_PALETTE_VALUES, this.getColorPalleteId(), COLOR_PALETTE_VALUES.categorical);
}

export function getMapType() {
  return _.get(this, 'series[0].mapOptions.mapType');
}

export function getPointAggregation() {
  return _.get(this, 'series[0].mapOptions.pointAggregation');
}

export function getShapeDatasetUid() {
  return _.get(this, 'configuration.shapefile.uid');
}

export function getShapeDatasetPrimaryKey() {
  return _.get(this, 'configuration.shapefile.primaryKey');
}

export function getMeasureColumn() {
  const columnName = _.get(this, 'series[0].dataSource.measure.columnName', '*');
  return (columnName == null) ? '*' : columnName;
}

export function getMeasureAggregation() {
  const aggregatFunction = _.get(this, 'series[0].dataSource.measure.aggregationFunction', 'count');
  return (aggregatFunction == null) ? 'count' : aggregatFunction;
}

export function getMeasureForeignKey() {
  return _.get(this, 'configuration.computedColumnName');
}

