import _ from 'lodash';

export const LAYERS = Object.freeze({
  LINE: 'lineLayer'
});

export const SOURCES = Object.freeze({
  LINE: 'lineVectorDataSource'
});

export default class Lines {
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
    this._map.addSource(SOURCES.LINE, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.LINE,
      'type': 'line',
      'source': SOURCES.LINE,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'line-color': vif.getLineColor(renderOptions.colorBy, renderOptions.colorByCategories),
        'line-width': vif.getLineWidth(renderOptions.aggregateAndResizeBy, renderOptions.resizeByRange)
      }
    });

    this._existingVif = vif;
    this._existingRenderOptions = renderOptions;
  }

  update(vif, renderOptions) {
    if (this._shouldChangeSourceOptions(vif, renderOptions)) {
      this.destroy();
      this.setup(vif, renderOptions);
      return;
    }

    this._map.setPaintProperty(LAYERS.LINE,
      'line-color',
      vif.getLineColor(renderOptions.colorBy, renderOptions.colorByCategories));
    this._map.setPaintProperty(LAYERS.LINE,
      'line-width',
      vif.getLineWidth(renderOptions.aggregateAndResizeBy, renderOptions.resizeByRange));

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
      'aggregateBy': renderOptions.aggregateAndResizeBy,
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
