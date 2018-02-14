import _ from 'lodash';

export const SOURCES = Object.freeze({
  SHAPE: 'polygonVectorDataSource'
});

export const LAYERS = Object.freeze({
  SHAPE_OUTLINE: 'shape-line',
  SHAPE_FILL: 'shape-fill'
});

export default class Shapes {
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
    this._map.addSource(SOURCES.SHAPE, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.SHAPE_OUTLINE,
      'type': 'line',
      'source': SOURCES.SHAPE,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'line-color': vif.getShapeLineColor(renderOptions.colorByCategories),
        'line-width': 2
      }
    }, renderOptions.layerStyles.INSERT_FILL_LAYERS_BEFORE);

    this._map.addLayer({
      'id': LAYERS.SHAPE_FILL,
      'type': 'fill',
      'source': SOURCES.SHAPE,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'fill-color': vif.getShapeFillColor(renderOptions.colorBy, renderOptions.colorByCategories),
        'fill-outline-color': vif.getShapeFillOutlineColor(renderOptions.colorByCategories)
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

    this._map.setPaintProperty(LAYERS.SHAPE_OUTLINE,
      'line-color',
      vif.getShapeLineColor(renderOptions.colorByCategories)
    );
    this._map.setPaintProperty(LAYERS.SHAPE_FILL,
      'fill-color',
      vif.getShapeFillColor(renderOptions.colorBy, renderOptions.colorByCategories)
    );
    this._map.setPaintProperty(LAYERS.SHAPE_FILL,
      'fill-outline-color',
      vif.getShapeFillOutlineColor(renderOptions.colorBy, renderOptions.colorByCategories)
    );

    // The prepend-before for fillLayer will change only on baseMap style change.
    // On basemap style change, we resetup the overlay already. So we dont have to
    // take care of 'prepend-before-layer' change.
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
