import _ from 'lodash';

import { VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';

// Utility functions for fetching configuration related to rendering of lines.
// These functions gets added to the vif object (see vifDecorator|views/UnifiedMap).
// So that multiple files(overlays/lines-partials/legends/mapFactory) can
// reuse them directly.

export function getLineColor(colorByColumnAlias, colorByCategories) {
  if (_.isNull(colorByCategories)) {
    return _.get(this, 'series[0].color.primary', '#ff00ff');
  }

  return this.getPaintPropertyForColorByCategories(colorByColumnAlias, colorByCategories);
}

export function getColorLinesByColumn() {
  return _.get(this, 'series[0].mapOptions.colorLinesBy');
}

export function getWeighLinesByColumn() {
  return _.get(this, 'series[0].mapOptions.weighLinesBy');
}

export function getLineWidth(aggregateAndResizeBy, resizeByRange) {
  if (!_.isString(this.getWeighLinesByColumn())) {
    return _.get(this, 'series[0].mapOptions.lineWeight', VIF_CONSTANTS.LINE_WEIGHT.DEFAULT);
  }

  const minWidth = _.get(this, 'series[0].mapOptions.minimumLineWeight', VIF_CONSTANTS.LINE_MAP_MIN_LINE_WEIGHT.DEFAULT);
  const maxWidth = _.get(this, 'series[0].mapOptions.maximumLineWeight', VIF_CONSTANTS.LINE_MAP_MAX_LINE_WEIGHT.DEFAULT);
  const dataClasses = _.get(this, 'series[0].mapOptions.numberOfDataClasses', VIF_CONSTANTS.NUMBER_OF_DATA_CLASSES.DEFAULT);

  return this.getResizeByRangeBuckets(aggregateAndResizeBy, resizeByRange,
    minWidth, maxWidth, dataClasses, 'interval');
}
