import _ from 'lodash';

// Adds mapbox-gl sources/layers for rendering heatClusters.
// On vif change, updates the layers or destroys and recreate
// if change required in the source.
const LAYERS = Object.freeze({
  HEAT: 'heatLayer'
});

const SOURCES = Object.freeze({
  HEAT: 'heatVectorDataSource'
});

export default class HeatClusters {
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
    this._map.addSource(SOURCES.HEAT, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.HEAT,
      'type': 'heatmap',
      'source': SOURCES.HEAT,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        // Increase the heatmap weight based on number of points
        'heatmap-weight': {
          'property': 'count',
          'type': 'exponential',
          'stops': [
          [0, 0.2],
          [10, 0.5],
          [150, 1]
          ]
        },
        // Increase the heatmap color intensity by zoom level
        // (heatmap-intensity is a multiplier on top of heatmap-weight)
        'heatmap-intensity': {
          'stops': [
          [0, 0.5],
          [9, 1]
          ]
        },
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        'heatmap-color': [
          'interpolate',
        ['linear'],
        ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': {
          'stops': [
          [0, 20],
          [9, 15]
          ]
        }
      }
    }, renderOptions.layerStyles.INSERT_FILL_LAYERS_BEFORE);

    this._existingVif = vif;
    this._existingRenderOptions = renderOptions;
  }

  update(vif, renderOptions) {
    if (this._shouldChangeSourceOptions(vif, renderOptions)) {
      this.destroy();
      this.setup(vif, renderOptions);
      return;
    }

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
      'tiles': [renderOptions.dataUrl]
    };
  }

  destroy() {
    _.each(LAYERS, (layerId) => {
      this._map.removeLayer(layerId);
    });
    _.each(SOURCES, (sourceId) => {
      this._map.removeSource(sourceId);
    });
  }
}
