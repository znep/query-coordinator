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
