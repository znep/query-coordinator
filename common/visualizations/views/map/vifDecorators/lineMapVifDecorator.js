import _ from 'lodash';

// Utility functions for fetching configuration related to rendering of lines.
// These functions gets added to the vif object (see vifDecorator|views/UnifiedMap).
// So that multiple files(overlays/lines-partials/legends/mapFactory) can
// reuse them directly.
export function getLineColorByColumn() {
  return _.get(this, 'series[0].mapOptions.colorLinesBy');
}

export function getLineWeighByColumn() {
  return _.get(this, 'series[0].mapOptions.weighLinesBy');
}

export function getLineColor(colorByColumnAlias, colorByCategories) {
  if (colorByCategories == null) {
    return _.get(this, 'series[0].color.primary', '#ff00ff');
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

export function getLineWidth(aggregateAndResizeBy, resizeByRange) {
  if (!_.isString(this.getLineWeighByColumn())) {
    return _.get(this, 'series[0].mapOptions.lineWeight', 5);
  }

  const minWidth = _.get(this, 'series[0].mapOptions.minimumLineWeight', 3);
  const maxWidth = _.get(this, 'series[0].mapOptions.maximumLineWeight', 7);
  const dataClasses = _.get(this, 'series[0].mapOptions.numberOfDataClasses', 5);

  return this.getResizeByRangeBuckets(aggregateAndResizeBy, resizeByRange,
    minWidth, maxWidth, dataClasses, 'interval');
}
