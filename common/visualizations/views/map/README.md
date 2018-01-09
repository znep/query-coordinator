## Mapbox-gl Fork
We are using a [fork of mapbox-gl](http://github.com/bewithjonam/mapbox-gl-js).

##### Background:
[SuperCluster](https://github.com/mapbox/supercluster) is used internally by mapbox for clustering points.

##### Reasons for fork:
- To expose getClusterLeaves function in supercluster. (mapbox-gl has not added the interface to it, so we cannot use getClusterLeaves using main mapbox-gl. We use getClusterLeaves to spiderfy and show the pins with a cluster at very narrower zoom levels.)
- To support Clustering and aggregating/sum by field. (SuperCluster, can aggregate points and sum up values in each point, rather than just giving the count of points in each cluster. We have exposed it via 'clusterBy' property.)
- To support geojson tiles (As of writing this Readme, mapbox do not have support for geojson tile sources and also no support for custom tile sources.)

##### To build publish the fork:
* Clone the [repo](http://github.com/bewithjonam/mapbox-gl-js)
* Install node (version that i used is v6.2.2)
* ```yarn install```
* ```yarn build-min``` if you want debug the changes in  mapbox-js, you can use build-dev.
* For more info visit: https://github.com/mapbox/mapbox-gl-js/blob/master/CONTRIBUTING.md
* npm publish

#### To upgrade mapbox-gl-js in the fork
* Clone the [repo](http://github.com/bewithjonam/mapbox-gl-js)
* Add mapbox/mapbox-gl-js(http://github.com/mapbox/mapbox-gl-js) as a remote. ```git remote add mapbox git@github.com:mapbox/mapbox-gl-js.git;```
* Fetch the changes in the mapbox remote.```git fetch mapbox;```
* Merge the version tag into the fork. ```git merge v0.29.0;```
* Fix the conflicts if any.
* Make sure that the examples in the fork_examples work.

## Implementation
Some implementation details below.

##### Tile url customization
Before making the tile request, we substitute soql params placeholder in the url with the actual values for the tiles. This is done using the map's transformRequest option.
Below are the placeholders and their substitution.
   *  \{\{'point' column condition\}\} => intersects(point, 'POLYGON((90.00 20.00, .....))')
   * {snap_zoom} => options.snapZoom[tile zoom] || defaultSnapZoom for current zoom
   * {snapPrecision} => options.snapZoom[tile zoom] || defaultSnapZoom for current zoom
   * {simplifyPrecision} => options.snapZoom[tile zoom] || defaultSnapZoom for current zoom

###### Options:
** snapZoom **: hash with zoom as keys and snapZoom values as values. default: current_zoom - 6
** snapPrecision **: hash with zoom as keys and snapPrecision values as values. default: 0.0001 / (2 * current_zoom)
** simplifyPrecision **: hash with zoom as keys and simplifyPrecision values as values. default: 0.0001 / (2 * current_zoom)

###### Example tile url:
```
https://opendata.test-socrata.com/resource/aaaa-bbbb.geojson?
  $query=select simplify_preserve_topology(snap_to_grid(the_geom,{snap_precision}),{simplify_precision})
  where  type='restaurant'
  group by simplify_preserve_topology(snap_to_grid(the_geom, {snap_precision}),{simplify_precision})
  limit 200000
```
###### Example options:
```javascript
  var options = {
  snapZoom: {
    1: 3,
    2: 3,
    3: 3,
    4: 6,
    5: 6,
    6: 6,
    7: 9,
    8: 9,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
    13: 13,
    14: 14,
    15: 15,
    16: 16,
  },
  snapPrecision: {
    1: 0.001,
    2: 0.001,
    3: 0.001,
    4: 0.001,
    5: 0.001,
    6: 0.001,
    7: 0.001,
    8: 0.001,
    9: 0.001,
    10: 0.0006,
    11: 0.0006,
    12: 0.0001,
    13: 0.0001,
    14: 0.000002,
    15: 0.0000001,
    16: 0.000003125,
  },
  simplifyPrecision: {
    1: 0.001,
    2: 0.001,
    3: 0.001,
    4: 0.001,
    5: 0.001,
    6: 0.001,
    7: 0.001,
    8: 0.001,
    9: 0.001,
    10: 0.0006,
    11: 0.0006,
    12: 0.0001,
    13: 0.0001,
    14: 0.000002,
    15: 0.0000001,
    16: 0.000003125,
  }
}
```
