import _ from 'lodash';

import { COLOR_PALETTE_VALUES } from 'common/authoring_workflow/constants';
import { MAP_TYPES, POINT_AGGREATIONS } from 'common/visualizations/views/mapConstants';
import ChoroplethMapUtils from 'common/visualizations/views/ChoroplethMapUtils';

export function isRegionMap() {
  return this.getMapType() === MAP_TYPES.POINT_MAP &&
    this.getPointAggregation() === POINT_AGGREATIONS.REGION_MAP &&
    !_.isUndefined(this.getShapeDatasetUid());
}

export function getRegionMapBucketsCount() {
  return _.get(this, 'series[0].mapOptions.numberOfDataClasses', 5);
}

export function getRegionMapBuckets(measures) {
  let bucketMethod;
  if (measures <= this.getRegionMapBucketsCount()) {
    bucketMethod = 'equalInterval';
  } else {
    bucketMethod = 'jenks';
  }

  const rawBuckets = new ChoroplethMapUtils({}).createClassBreaks({
    data: _.map(measures, 'value'),
    method: bucketMethod,
    numberOfClasses: this.getRegionMapBucketsCount()
  });

  const colors = this.getColorPalette();

  // Converting
  //  colors => ['#aaa', '#bbb', '#ccc', '#ddd', ......]
  //  rawBuckets => [6, 121, 106290, 167009, 253225]
  // to
  //  [
  //    {start: 6, end: 121, color: '#aaa'},
  //    {start: 121, end: 106290, color: '#bbb'},
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

