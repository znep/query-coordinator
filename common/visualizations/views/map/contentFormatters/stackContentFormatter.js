import _ from 'lodash';
import $ from 'jquery';

// Sample Stack Feature: (Geojson object got from mapbox-gl map)
//  - Clustered many snappedAndGroupedPoints into a cluster
//    {
//      "type": "Feature",
//      "geometry": {
//        "type": "Point",
//        "coordinates": [-122.44754076004028,37.8044394394888]
//      },
//      "properties": {
//        "cluster": true
//        "cluster_id": 13
//        "count": 15489
//        "count_abbrev": "15k"
//        "count_group": "{\"Abandoned Vehicle\":2645,\"__$$other$$__\":6946,\"Street and Sidewalk Cleaning\":3109,\"Graffiti Private Property\":1027,\"Graffiti Public Property\":1424,\"SFHA Requests\":338}"
//        "point_count": 162
//        "point_count_abbreviated": 162
//        "__aggregate_by__": 97491
//        "__aggregate_by___abbrev": "97k"
//        "__aggregate_by___group": "{\"Abandoned Vehicle\":17386,\"__$$other$$__\":44145,\"Street and Sidewalk Cleaning\":18816,\"Graffiti Private Property\":6191,\"Graffiti Public Property\":8587,\"SFHA Requests\":2366}"
//      },
//      "layer": { ... }
//    }
//  - Single snapppedAndGroupedPoints without cluster
//    {
//      "type":"Feature",
//      "geometry": {
//        "type": "Point",
//        "coordinates":[-122.46716380119324,37.799594712784625]
//      },
//      "properties": {
//        "__color_by_category__":"__$$other$$__",
//        "__count__":2,
//        "__resize_by__":4,
//        "__resize_by___abbrev":"4",
//        "__count___abbrev":"2"
//      },
//      "layer":{..}
//    }

// Builds html tipsy content for a stack.
export function setPopupContentForStack(
    {
      element: element,
      vif: vif,
      renderOptions: renderOptions,
      feature: stackFeature
    } = {}
) {
  const properties = _.get(stackFeature, 'properties', {});
  const count = properties[renderOptions.countBy];
  const countUnits = vif.getUnits(count);
  const stackPopupHtml = '<div class="point-map-popup point-popup">' +
    `<div class="popup-title">${count} ${countUnits}</div>` +
    getPointsBreakdownByColor(vif, renderOptions, stackFeature) +
  '</div>';

  $(element).html(stackPopupHtml);
  return stackPopupHtml;
}


// Builds html content for colorBy categories->count breakdown for the given stack.
function getPointsBreakdownByColor(vif, renderOptions, stackFeature) {
  const colorByBuckets = vif.getColorByBuckets(renderOptions.colorByCategories);
  const isCluster = _.get(stackFeature, 'properties.cluster', false);

  if (_.isEmpty(colorByBuckets)) {
    return '';
  }

  return '<ul class="color-breakdown">' +
    (isCluster ?
      getClusterOfSnappedPointsColorByBreakdown(vif, colorByBuckets, renderOptions, stackFeature) :
      getSnappedPointsColorByBreakdown(vif, colorByBuckets, renderOptions, stackFeature)
    ) +
    '</ul>';
}

// Arguments:
//  colorByBuckets    : [{category: 'Other', id: '__$$other$$__', color: #ffddff}, ...]
//  countBy           : <string> name of the property that holds the number of points grouped into
//                      a single feature after snapping on the soql side.
//  stackFeature      : geosjon object of the hovered over stack.
function getClusterOfSnappedPointsColorByBreakdown(vif, colorByBuckets, renderOptions, stackFeature) {
  // categoryToBucketsMap = {
  //    Other: {category: 'Other', id: '__$$other$$__', color: #ffddff},
  //    Category1: {category: 'Category1', id: 'Category1', color: #ffddff},
  //    ...
  // }
  const categoryToBucketMap = _.chain(colorByBuckets).
    keyBy((colorByBucket) => _.get(colorByBucket, 'id', colorByBucket.category)).
    value();
  const categoryBreakdownStr = _.get(stackFeature, ['properties', `${renderOptions.countBy}_group`], '{}');
  // categoryBreakdown = {Other: 10, Category1: 12, Category2: 12}
  const categoryBreakdown = JSON.parse(categoryBreakdownStr);

  return _.chain(categoryBreakdown).
    map((count, categoryId) => {
      const color = _.get(categoryToBucketMap, [categoryId, 'color']);
      const category = _.get(categoryToBucketMap, [categoryId, 'category']);

      return { category, color, count };
    }).
    sortBy('category').
    map(({ category: category, color: color, count: count }) => {
      return formatColorBreakdownEntry(vif, category, color, count);
    }).
    value().
    join('');
}

// Arguments:
//  colorByBuckets          : [{category: 'Other', id: '__$$other$$__', color: #ffddff}, ...]
//  renderOptions.countBy   : <string> name of the property that holds the number of points grouped into
//                            a single feature after snapping on the soql side.
//  renderOptions.colorBy   : <string> name of the property that holds dataset column value based on which
//                            the points are colored by
//  stackFeature            : geosjon object of the hovered over stack.
function getSnappedPointsColorByBreakdown(vif, colorByBuckets, renderOptions, stackFeature) {
  const stackCategory = _.get(stackFeature, ['properties', renderOptions.colorBy]);
  const colorByBucketForStack = _.find(colorByBuckets, { id: stackCategory });

  const category = _.get(colorByBucketForStack, 'category');
  const color = _.get(colorByBucketForStack, 'color');
  const count = _.get(stackFeature, ['properties', renderOptions.countBy]);

  return formatColorBreakdownEntry(vif, category, color, count);
}

function formatColorBreakdownEntry(vif, category, color, count) {
  const countUnits = vif.getUnits(count);

  return `<li style="color: ${color}">` +
    `<div class="count">${count} ${countUnits}</div>` +
    `<div class="category">${category}</div>` +
    '</li>';
}
