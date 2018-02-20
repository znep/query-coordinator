import _ from 'lodash';

import { NO_COLOR } from 'common/visualizations/views/mapConstants';

// Utility functions for fetching configuration related to rendering of shapes.
// These functions gets added to the vif object (see vifDecorator|views/UnifiedMap).
// So that multiple files(overlays/shapes-partials/legends/mapFactory) can
// reuse them directly.

export function getShapeColorByColumn() {
  return _.get(this, 'series[0].mapOptions.colorBoundariesBy');
}

export function getShapeFillColor(colorByColumnAlias, colorByCategories) {
  if (_.isNull(colorByCategories)) {
    return NO_COLOR;
  }

  return this.getPaintPropertyForColorByCategories(colorByColumnAlias, colorByCategories);
}

export function getShapeOutlineColor(colorByCategories) {
  if (_.isEmpty(colorByCategories)) {
    return _.get(this, 'series[0].color.primary');
  }
  return '#ffffff';
}
