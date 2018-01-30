export const clusterFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [-122.44754076004028, 37.8044394394888]
  },
  properties: {
    cluster: true,
    cluster_id: 13,
    count: 15489,
    count_abbrev: '15k',
    point_count: 162,
    point_count_abbreviated: 162
  },
  layer: {
    id: 'cluster-circle'
  }
};

export const pointFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [-122.44754076004028, 37.8044394394888]
  },
  properties: {
    cluster: false,
    __aggregate_by__: 97491
  },
  layer: {
    id: 'point'
  }
};

export const stackFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [-122.44754076004028, 37.8044394394888]
  },
  properties: {
    cluster: true,
    cluster_id: 13,
    count: 15489,
    count_abbrev: '15k',
    count_group: '{"Abandoned Vehicle":2645,"__$$other$$__":6946,"Street and Sidewalk Cleaning":3109,"Graffiti Private Property":1027,"Graffiti Public Property":1424,"SFHA Requests":338}',
    point_count: 162,
    point_count_abbreviated: 162,
    __aggregate_by__: 97491,
    __aggregate_by___abbrev: '97k',
    __aggregate_by___group: '{"Abandoned Vehicle":17386,"__$$other$$__":44145,"Street and Sidewalk Cleaning":18816,"Graffiti Private Property":6191,"Graffiti Public Property":8587,"SFHA Requests":2366}'
  },
  layer: {
    id: 'stack-circle'
  }
};
