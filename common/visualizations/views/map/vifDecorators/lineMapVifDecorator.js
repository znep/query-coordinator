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
  const colorPallete = this.getColorPallete();

  if (colorByCategories == null) {
    return _.get(this, 'series[0].color.primary', '#ff00ff');
  }

  const stops = _.map(colorByCategories, (colorByCategory, index) => [colorByCategory, colorPallete[index]]);

  return {
    property: colorByColumnAlias,
    type: 'categorical',
    stops,
    default: colorPallete[stops.length]
  };
}

export function getLineWidth(aggregateAndResizeBy, resizeByRange) {
  if (!_.isString(this.getLineWeighByColumn())) {
    return _.get(this, 'series[0].mapOptions.lineWeight', 5);
  }

  const minWidth = _.get(this, 'series[0].mapOptions.minimumLineWeight', 3);
  const maxWidth = _.get(this, 'series[0].mapOptions.maximumLineWeight', 7);
  const numberOfDataClasses = _.get(this, 'series[0].mapOptions.numberOfDataClasses', 5);

  if (minWidth === maxWidth) {
    return minWidth;
  }
  if (resizeByRange.min === resizeByRange.max) {
    return (minWidth + maxWidth) / 2;
  }

  const widthStep = (maxWidth - minWidth) / numberOfDataClasses;
  const resizeStep = (resizeByRange.max - resizeByRange.min) / numberOfDataClasses;

  const widthStops = _.range(minWidth, maxWidth, widthStep);
  const resizeStops = _.range(resizeByRange.min, resizeByRange.max, resizeStep);

  return {
    type: 'interval',
    property: aggregateAndResizeBy,
    stops: _.zip(resizeStops, widthStops),
    'default': minWidth
  };
}
