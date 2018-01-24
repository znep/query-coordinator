import _ from 'lodash';
import { CLUSTER_BUCKETS } from 'common/visualizations/views/mapConstants';

export function getPointColorByColumn() {
  return _.get(this, 'series[0].mapOptions.colorPointsBy');
}

export function getNumberOfDataClasses() {
  return _.get(this, 'series[0].mapOptions.numberOfDataClasses', 5);
}

export function getMaxClusteringZoomLevel() {
  return _.get(this, 'series[0].mapOptions.maxClusteringZoomLevel', 11);
}

export function getClusterRadius() {
  return _.get(this, 'series[0].mapOptions.clusterRadius', 80);
}

export function getStackRadius() {
  return _.get(this, 'series[0].mapOptions.stackRadius', 20);
}

export function getPointResizeByColumn() {
  return _.get(this, 'series[0].mapOptions.resizePointsBy');
}

export function getPointOpacity() {
  return _.get(this, 'configuration.pointOpacity', 1);
}

export function getClusterCircleRadius(resizeByRange, aggregateAndResizeBy) {
  const minRadius = 12;
  const maxRadius = _.get(this, 'series[0].mapOptions.maxClusterSize', 40) / 2;
  return {
    type: 'interval',
    property: aggregateAndResizeBy,
    stops: [
      [CLUSTER_BUCKETS.SMALL * resizeByRange.avg, minRadius],
      [CLUSTER_BUCKETS.MEDIUM * resizeByRange.avg, (minRadius + maxRadius) / 2],
      [CLUSTER_BUCKETS.LARGE * resizeByRange.avg, maxRadius]
    ],
    'default': minRadius
  };
}

export function getPointCircleRadius(resizeByRange, aggregateAndResizeBy) {
  if (!_.isString(this.getPointResizeByColumn())) {
    return _.get(this, 'series[0].mapOptions.pointMapPointSize', 10) / 2;
  }

  const minRadius = _.get(this, 'series[0].mapOptions.minimumPointSize', 10) / 2;
  const maxRadius = _.get(this, 'series[0].mapOptions.maximumPointSize', 18) / 2;
  const dataClasses = _.get(this, 'series[0].mapOptions.numberOfDataClasses', 5);

  const radiusStep = (maxRadius - minRadius) / dataClasses;
  const resizeStep = (resizeByRange.max - resizeByRange.min) / dataClasses;

  const radiusStops = _.range(minRadius, maxRadius, radiusStep);
  const resizeStops = _.range(resizeByRange.min, resizeByRange.max, resizeStep);

  return {
    type: 'exponential',
    property: aggregateAndResizeBy,
    stops: _.zip(resizeStops, radiusStops),
    'default': minRadius
  };
}

// If 'colorByColumn' not configured
//    returns the configured point color.
// If 'colorByColumn' configured and categories present
//    We set stops with one color for each category from the configured pallete.
//    And set the next available color in the pallete as default
//    for the remaining categories.
export function getPointColor(colorByColumnAlias, colorByCategories) {
  const colorPalette = this.getColorPalette();

  if (colorByCategories == null) {
    return _.get(this, 'series[0].color.primary', '#ff00ff');
  }

  const stops = _.map(colorByCategories, (colorByCategory, index) => [colorByCategory, colorPalette[index]]);

  return {
    property: colorByColumnAlias,
    type: 'categorical',
    stops,
    default: colorPalette[stops.length]
  };
}
