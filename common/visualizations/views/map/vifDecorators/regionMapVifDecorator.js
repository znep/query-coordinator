import _ from 'lodash';

import { MAP_TYPES, POINT_AGGREGATIONS, VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';
import ChoroplethMapUtils from 'common/visualizations/views/ChoroplethMapUtils';

export function isRegionMap() {
  return this.getMapType() === MAP_TYPES.POINT_MAP &&
    this.getPointAggregation() === POINT_AGGREGATIONS.REGION_MAP &&
    !_.isUndefined(this.getShapeDatasetUid());
}

export function getNumberOfDataClasses() {
  return _.get(this, 'series[0].mapOptions.numberOfDataClasses', VIF_CONSTANTS.NUMBER_OF_DATA_CLASSES.DEFAULT);
}

export function getRegionMapBuckets(measures) {
  let bucketMethod;
  if (measures <= this.getNumberOfDataClasses()) {
    bucketMethod = 'equalInterval';
  } else {
    bucketMethod = 'jenks';
  }

  const rawBuckets = new ChoroplethMapUtils({}).createClassBreaks({
    data: _.map(measures, 'value'),
    method: bucketMethod,
    numberOfClasses: this.getNumberOfDataClasses()
  });

  const colors = this.getColorPalette(rawBuckets.length - 1);

  // Converting
  //  colors => ['#aaaaaa', '#bbbbbb', '#cccccc', '#ddddddd', ......]
  //  rawBuckets => [6, 121, 106290, 167009, 253225]
  // to
  //  [
  //    {start: 6, end: 121, color: '#aaaaaa'},
  //    {start: 121, end: 106290, color: '#bbbbbb'},
  //    ...
  //  ]
  // Note: we are not adjusting end by adding 1 to it,
  // as it can be decimal.
  return _.chain(0).
    range(rawBuckets.length - 1, 1).
    map((index) => {
      return {
        start: rawBuckets[index],
        end: rawBuckets[index + 1],
        color: colors[index]
      };
    }).
    value();
}
