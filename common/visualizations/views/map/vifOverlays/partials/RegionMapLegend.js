import $ from 'jquery';
import _ from 'lodash';

import ChoroplethMapUtils from 'common/visualizations/views/ChoroplethMapUtils';

const LEGEND_CONTAINER_CLASS = 'region-map-legend-container';

export default class RegionMapLegend {
  constructor(element) {
    this._element = element;
    this._choroplethMapUtils = new ChoroplethMapUtils({});
  }

  // Render options:
  //    measures: [{ shapeId: "1", value: 106290 }, ....]
  //    shapeColorConfigs: [{}]
  //    bucket: [{ start: 6, end: 121, color: "#e41a1c" }, ...]
  //    dataUrl: https://example.com/resource/four-four.geojson?$query=.... (tile url)
  //    shapePrimaryKey: _feature_id (primaryKey name in the tile data)
  show(vif, renderOptions) {
    const buckets = _.get(renderOptions, 'buckets');

    this._element.find(`.${LEGEND_CONTAINER_CLASS}`).remove();
    if (_.isEmpty(buckets)) {
      return;
    }

    const $legendContainer = $('<div>', {
      'class': LEGEND_CONTAINER_CLASS
    });

    const $bucketEndValue = $('<div>', {
      'class': 'bucket-end-value'
    });
    $bucketEndValue.text(this.formatValue(_.last(buckets).end));
    $legendContainer.append($bucketEndValue);

    _.eachRight(buckets, (bucket) => {
      const $bucketDiv = $('<div>', {
        'class': 'region-map-bucket',
        'data-start': bucket.start,
        'data-end': bucket.end,
        'data-color': bucket.color
      });
      const $bucketColor = $('<div>', {
        'class': 'bucket-color',
        'style': `background-color: ${bucket.color};`
      });
      const $bucketValue = $('<div>', {
        'class': 'bucket-value'
      });
      $bucketValue.text(this.formatValue(bucket.start));

      $bucketDiv.append($bucketValue, $bucketColor);
      $legendContainer.append($bucketDiv);
    });
    this._element.append($legendContainer);
  }

  formatValue(value) {
    return this._choroplethMapUtils.bigNumTickFormatter(value);
  }
}
