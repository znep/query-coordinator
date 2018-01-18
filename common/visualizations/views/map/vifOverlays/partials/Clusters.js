import _ from 'lodash';

export const SOURCES = Object.freeze({
  CLUSTERS: 'clustersVectorDataSource'
});

export const LAYERS = Object.freeze({
  CLUSTER_CIRCLE: 'cluster-circle',
  CLUSTER_COUNT_LABEL: 'cluster-count-label'
});

export default class Clusters {
  constructor(map) {
    this._map = map;
  }

  static sourceIds() {
    return _.values(SOURCES);
  }

  static layerIds() {
    return _.values(LAYERS);
  }

  setup(vif, renderOptions) {
    this._map.addSource(SOURCES.CLUSTERS, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.CLUSTER_CIRCLE,
      'type': 'circle',
      'source': SOURCES.CLUSTERS,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'circle-radius': vif.getClusterCircleRadius(renderOptions.resizeByRange),
        'circle-color': renderOptions.layerStyles.CLUSTER_COLOR,
        'circle-stroke-width': renderOptions.layerStyles.CLUSTER_BORDER_SIZE,
        'circle-stroke-color': renderOptions.layerStyles.CLUSTER_BORDER_COLOR,
        'circle-stroke-opacity': renderOptions.layerStyles.CLUSTER_BORDER_OPACITY
      }
    });

    this._map.addLayer({
      id: LAYERS.CLUSTER_COUNT_LABEL,
      type: 'symbol',
      'source': SOURCES.CLUSTERS,
      'source-layer': '_geojsonTileLayer',
      layout: {
        // If clustered by mapbox,
        //  it will have sum_abbrev (which is the sum of counts of every record)
        // If a single record from server,
        //  it will have count
        // In any case either sum_abbrev will be present or count will be present.
        // So the below expression will print the existing one and empty string for
        // non-existing one.
        'text-field': `{sum_abbrev}{${renderOptions.aggregateAndResizeBy}}`,
        'text-size': 12,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': renderOptions.layerStyles.CLUSTER_TEXT_COLOR
      }
    });

    this._existingVif = vif;
    this._existingRenderOptions = renderOptions;
  }

  update(vif, renderOptions) {
    if (this._shouldChangeSourceOptions(vif, renderOptions)) {
      this._destroy();
      this.setup(vif, renderOptions);
      return;
    }

    // Updating cluster look and feel based on new base-map-style in vif
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE,
      'circle-radius',
      vif.getClusterCircleRadius(renderOptions.resizeByRange));
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE,
      'circle-color',
      renderOptions.layerStyles.CLUSTER_COLOR);
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE,
      'circle-stroke-width',
      renderOptions.layerStyles.CLUSTER_BORDER_SIZE);
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE,
      'circle-stroke-color',
      renderOptions.layerStyles.CLUSTER_BORDER_COLOR);
    this._map.setPaintProperty(LAYERS.CLUSTER_CIRCLE,
      'circle-stroke-opacity',
      renderOptions.layerStyles.CLUSTER_BORDER_OPACITY);
    this._map.setPaintProperty(LAYERS.CLUSTER_COUNT_LABEL,
      'text-color',
      renderOptions.layerStyles.CLUSTER_TEXT_COLOR);

    this._existingVif = vif;
    this._existingRenderOptions = renderOptions;
  }

  _shouldChangeSourceOptions(vif, renderOptions) {
    const existingSourceOptions = this._sourceOptions(this._existingVif, this._existingRenderOptions);
    const newSourceOptions = this._sourceOptions(vif, renderOptions);

    return !_.isEqual(existingSourceOptions, newSourceOptions);
  }

  _sourceOptions(vif, renderOptions) {
    return {
      'type': 'vector',
      'geojsonTile': true,
      'cluster': true,
      'clusterRadius': vif.getClusterRadius(),
      'aggregateBy': renderOptions.aggregateAndResizeBy,
      'tiles': [renderOptions.dataUrl],
      'maxzoom': vif.getMaxClusteringZoomLevel()
    };
  }

  _destroy() {
    _.each(LAYERS, (layerId) => {
      this._map.removeLayer(layerId);
    });
    _.each(SOURCES, (sourceId) => {
      this._map.removeSource(sourceId);
    });
  }
}
