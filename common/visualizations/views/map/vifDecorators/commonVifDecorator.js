import _ from 'lodash';
import d3 from 'd3';

import { COLOR_PALETTE_VALUES_FOR_MAPS } from 'common/authoring_workflow/constants';

export function getDomain() {
  return _.get(this, 'series[0].dataSource.domain');
}

export function getDatasetUid() {
  return _.get(this, 'series[0].dataSource.datasetUid');
}

export function getColumnName() {
  return _.get(this, 'series[0].dataSource.dimension.columnName');
}

export function getColorPaletteId() {
  return _.get(this, 'series[0].color.palette');
}

export function getColorPalette(count) {
  const colorPaletteGetter = _.get(
    COLOR_PALETTE_VALUES_FOR_MAPS,
    this.getColorPaletteId(),
    COLOR_PALETTE_VALUES_FOR_MAPS.categorical
  );

  return colorPaletteGetter(count);
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

// aggregateAndResizeBy : select as alias used for ResizeBy column in the tile data calls
//                        should be __count__ | __resize_by__ | __weigh_by__
// resizeByRange : minimum and maximum value of the selected column in ResizeRangeBy
// minPixels : min Value from the MapOptions will be  LineWeight | PointSize
// maxPixels : max Value from the MapOptions will be  LineWeight | PointSize
// dataClasses : No of data classes from the mapOptions
// propertyFunctionType  : string, should be 'exponential' | interval' Passed as paint property to the map

export function getResizeByRangeBuckets(aggregateAndResizeBy, resizeByRange,
                                        minPixels, maxPixels, dataClasses, propertyFunctionType) {
  if (minPixels === maxPixels) {
    return minPixels;
  }
  if (resizeByRange.max === resizeByRange.min) {
    return (minPixels + maxPixels) / 2;
  }

  const rangeDiff = Math.abs(resizeByRange.max - resizeByRange.min);
  const bucketSize = niceRoundOff(rangeDiff / dataClasses);
  const bucketStart = Math.floor(niceRoundOff(resizeByRange.min));

  const pixelDiff = Math.abs(maxPixels - minPixels);
  const pixelBucketSize = niceRoundOff(pixelDiff / dataClasses);
  const pixelStart = Math.floor(niceRoundOff(minPixels));

  const stops = _.map(_.range(0, (dataClasses + 1)), (bucketIndex) => {
    return [bucketStart + (bucketIndex * bucketSize), pixelStart + (bucketIndex * pixelBucketSize)];
  });

  return {
    type: propertyFunctionType,
    property: aggregateAndResizeBy,
    stops: stops,
    'default': minPixels
  };
}

// Rounds off numbers to nice round values using d3's nice function.
// For ex:
//    niceRoundOff(0.92342) => 1
//    niceRoundOff(19.7899) => 20
//    niceRoundOff(59) => 60
//    niceRoundOff(1127) => 1200
//    niceRoundOff(1333333) => 1400000
function niceRoundOff(value) {
  return d3.scale.linear().domain([0, value]).nice().domain()[1];
}

export function getColorByBuckets(colorByCategories) {
  // Converting
  //  colors => ['#aaa', '#bbb', '#ccc', '#ddd', ......]
  //  colorByCategories => [2011, 2012, 2013, ......]
  // to
  //  [
  //    {category: 2011, color: '#aaa'},
  //    {category: 2012, color: '#bbb'},
  //    ...
  //  ]
  if (_.isNull(colorByCategories)) {
    return [];
  }

  const colors = this.getColorPalette(colorByCategories.length + 1);

  return _.chain(colorByCategories).
    zipWith(colors, (category, color) => ({ category, color })).
    take(colorByCategories.length).
    concat({
      category: 'Other',
      color: colors[colorByCategories.length]
    }).
    value();
}
