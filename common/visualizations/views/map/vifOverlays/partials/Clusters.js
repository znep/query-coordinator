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
    const clusterCircleRadius = vif.getClusterCircleRadius(
      renderOptions.resizeByRange,
      renderOptions.aggregateAndResizeBy
    );

    this._map.addSource(SOURCES.CLUSTERS, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.CLUSTER_CIRCLE,
      'type': 'circle',
      'source': SOURCES.CLUSTERS,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'circle-radius': clusterCircleRadius,
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
        'text-field': `{${renderOptions.countBy}_abbrev}`,
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
      vif.getClusterCircleRadius(renderOptions.resizeByRange, renderOptions.aggregateAndResizeBy));
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
      'aggregateBy': _.uniq([renderOptions.aggregateAndResizeBy, renderOptions.countBy]),
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
