import _ from 'lodash';

const NO_COLOR = 'rgba(0, 0, 0, 0)';

// Utility functions for fetching configuration related to rendering of shapes.
// These functions gets added to the vif object (see vifDecorator|views/UnifiedMap).
// So that multiple files(overlays/shapes-partials/legends/mapFactory) can
// reuse them directly.

export function getShapeColorByColumn() {
  return _.get(this, 'series[0].mapOptions.colorBoundariesBy');
}

export function getShapeLineColor(colorByCategories) {
  if (_.isEmpty(colorByCategories)) {
    return _.get(this, 'series[0].color.primary');
  }
  return NO_COLOR;
}

export function getShapeFillColor(colorByColumnAlias, colorByCategories) {
  if (colorByCategories == null) {
    return NO_COLOR;
  }

  // +1 for 'other' category
  const colorPalette = this.getColorPalette(colorByCategories.length + 1);
  const stops = _.map(colorByCategories, (colorByCategory, index) => [colorByCategory, colorPalette[index]]);

  return {
    property: colorByColumnAlias,
    type: 'categorical',
    stops,
    default: colorPalette[stops.length]
  };
}

export function getShapeFillOutlineColor(colorByCategories) {
  if (_.isEmpty(colorByCategories)) {
    // If no color by category, no fill and outline.
    return NO_COLOR;
  }
  return '#fff';
}
