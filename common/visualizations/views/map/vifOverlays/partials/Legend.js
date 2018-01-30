import $ from 'jquery';
import _ from 'lodash';

import ChoroplethMapUtils from 'common/visualizations/views/ChoroplethMapUtils';

const LEGEND_CONTAINER_CLASS = 'legend-container';
const LEGEND_CONTAINER_HEIGHT = 260;

// Renders categorical/interval legend for maps, showing the color used on the map for
// each interval/category. Based on the type
//  'categorical' : It displays the color and the category associated with it. The legend items
//                  are ordered as given in the input buckets array. The first one appearing on top
//                  and the remaining buckets below them one after the other.
//  'interval'    : It displays the color and the interval associated with it. The start
//                  of the range like a subscript and the end of the range like a superscript.
//                  The legend items are ordered as smaller ranges(bottom) to bigger range(top).
// If no empty buckets(empty array) is given or if the destroy function is called, the existing
// legend gets removed from the given container.
export default class Legend {
  constructor(visualizationElement) {
    this._visualizationElement = visualizationElement;
    this._choroplethMapUtils = new ChoroplethMapUtils({});
  }

  // Arguments:
  // buckets  : array of buckets
  // type     : interval|category
  //
  // interval
  //    Bucket format:: { start: 6, end: 121, color: '#e41a1c' }
  //    order: small bucket to big bucket
  // categorical
  //    Bucket format: { category: 'Homicide', color: '#e41a1c'}
  //    order: top occuring category to lesser occuring category
  show(buckets, type = 'interval') {
    this._visualizationElement.find(`.${LEGEND_CONTAINER_CLASS}`).remove();

    if (_.isEmpty(buckets)) {
      return;
    }

    const $legendContainer = $('<div>', {
      'class': LEGEND_CONTAINER_CLASS,
      'style': `height: ${LEGEND_CONTAINER_HEIGHT}px;`
    });
    const orderedBuckets = this._getOrderedBuckets(buckets, type);

    if (type === 'interval') {
      const $bucketEndValue = $('<div>', {
        'class': 'bucket-end-value'
      });
      $bucketEndValue.text(this.formatValue(orderedBuckets[0].end));
      $legendContainer.append($bucketEndValue);
    }

    const bucketColorHeightPercentage = Math.floor(100 / buckets.length);

    _.each(orderedBuckets, (bucket) => {
      let $bucketDiv;
      let $bucketValue;

      if (type == 'interval') {
        $bucketDiv = $('<div>', {
          'class': 'map-bucket',
          'data-start': bucket.start,
          'data-end': bucket.end,
          'data-color': bucket.color,
          'style': `height: ${bucketColorHeightPercentage}%;`
        });
        $bucketValue = $('<div>', {
          'class': 'interval-bucket-value'
        });
        $bucketValue.text(this.formatValue(bucket.start));
      } else {
        $bucketDiv = $('<div>', {
          'class': 'map-bucket',
          'data-category': bucket.category,
          'data-color': bucket.color,
          'style': `height: ${bucketColorHeightPercentage}%;`
        });
        $bucketValue = $('<div>', {
          'class': 'categorical-bucket-value',
          'title': bucket.category
        });
        $bucketValue.text(bucket.category);
      }

      const $bucketColor = $('<div>', {
        'class': 'bucket-color',
        'style': `background-color: ${bucket.color};`
      });

      $bucketDiv.append($bucketValue, $bucketColor);
      $legendContainer.append($bucketDiv);
    });

    // socrata-visualization(visualizationElememt)
    //    |- socrata-visualization-container
    //        |-  unified-map-instance
    //        |-  legend-container
    // socrata-visualization-container has a z-index of 1. So if we append
    // Appending the Legend to .socrata-visualization-container so that it can
    // be z-indexed behind the mapbox-gl popups.
    this._visualizationElement.
      find('.socrata-visualization-container').
      append($legendContainer);
  }

  _getOrderedBuckets(buckets, type) {
    if (type === 'interval') {
      return [].concat(buckets).reverse();
    }

    return buckets;
  }

  destroy() {
    this._visualizationElement.find(`.${LEGEND_CONTAINER_CLASS}`).remove();
  }

  formatValue(value) {
    return this._choroplethMapUtils.bigNumTickFormatter(value);
  }
}
