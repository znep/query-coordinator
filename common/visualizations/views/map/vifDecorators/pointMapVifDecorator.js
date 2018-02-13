import _ from 'lodash';
import { CLUSTER_BUCKETS, VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';

export function getPointColorByColumn() {
  return _.get(this, 'series[0].mapOptions.colorPointsBy');
}

export function getNumberOfDataClasses() {
  return _.get(this, 'series[0].mapOptions.numberOfDataClasses', VIF_CONSTANTS.NUMBER_OF_DATA_CLASSES);
}

export function getMaxClusteringZoomLevel() {
  return _.get(this, 'series[0].mapOptions.maxClusteringZoomLevel', VIF_CONSTANTS.CLUSTERING_ZOOM.DEFAULT);
}

export function getClusterRadius() {
  return _.get(this, 'series[0].mapOptions.clusterRadius', VIF_CONSTANTS.CLUSTER_RADIUS.DEFAULT);
}

export function getStackRadius() {
  return _.get(this, 'series[0].mapOptions.stackRadius', VIF_CONSTANTS.STACK_RADIUS.DEFAULT);
}

export function getPointResizeByColumn() {
  return _.get(this, 'series[0].mapOptions.resizePointsBy');
}

export function getPointOpacity() {
// Point opacity in vif has a range of 0 to 100.
// Converting it to 0-1 for using in the paint property
  return _.get(this, 'configuration.pointOpacity', 100) / 100;
}

export function getClusterCircleRadius(resizeByRange, aggregateAndResizeBy) {
  const minRadius = 12;
  const maxRadius = _.get(this, 'series[0].mapOptions.maxClusterSize', VIF_CONSTANTS.CLUSTER_SIZE.DEFAULT) / 2;
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
    return _.get(this, 'series[0].mapOptions.pointMapPointSize', VIF_CONSTANTS.POINT_MAP_POINT_SIZE.DEFAULT) / 2;
  }

  const minRadius = _.get(this, 'series[0].mapOptions.minimumPointSize', VIF_CONSTANTS.POINT_MAP_MIN_POINT_SIZE.DEFAULT) / 2;
  const maxRadius = _.get(this, 'series[0].mapOptions.maximumPointSize', VIF_CONSTANTS.POINT_MAP_MAX_POINT_SIZE.DEFAULT) / 2;
  const dataClasses = _.get(this, 'series[0].mapOptions.numberOfDataClasses', VIF_CONSTANTS.NUMBER_OF_DATA_CLASSES.DEFAULT);

  return this.getResizeByRangeBuckets(aggregateAndResizeBy, resizeByRange,
    minRadius, maxRadius, dataClasses, 'exponential');
}

// If 'colorByColumn' not configured
//    returns the configured point color.
// If 'colorByColumn' configured and categories present
//    We set stops with one color for each category from the configured palette.
//    And set the next available color in the palette as default
//    for the remaining categories.
export function getPointColor(colorByColumnAlias, colorByCategories) {
  if (_.isNull(colorByCategories)) {
    return _.get(this, 'series[0].color.primary', '#ff00ff');
  }

  // +1 for 'other' category
  const colorPalette = this.getColorPalette(colorByCategories.length + 1);

  if (_.isEmpty(colorByCategories)) {
    return colorPalette[0];
  }

  const stops = _.map(colorByCategories, (colorByCategory, index) => [colorByCategory, colorPalette[index]]);

  return {
    property: colorByColumnAlias,
    type: 'categorical',
    stops,
    default: colorPalette[stops.length]
  };
}
