import _ from 'lodash';
const SOURCES = Object.freeze({
  POLYGON: 'polygonVectorDataSource'
});

const LAYERS = Object.freeze({
  SHAPE_FILL: 'shape-line'
});

export default class Regions {
  constructor(map) {
    this._map = map;
  }

  static sourceIds() {
    return _.values(SOURCES);
  }

  static layerIds() {
    return _.values(LAYERS);
  }

  // Render options:
  //    measures: [{ shapeId: "1", value: 106290 }, ....]
  //    shapeColorConfigs: [{}]
  //    bucket: [{ start: 6, end: 121, color: "#e41a1c" }, ...]
  //    dataUrl: https://example.com/resource/four-four.geojson?$query=.... (tile url)
  //    shapePrimaryKey: _feature_id (primaryKey name in the tile data)
  setup(vif, renderOptions) {
    this._map.addSource(SOURCES.POLYGON, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.SHAPE_FILL,
      'type': 'fill',
      'source': SOURCES.POLYGON,
      'source-layer': '_geojsonTileLayer',
      'paint': {
        'fill-color': {
          'type': 'categorical',
          'property': renderOptions.shapePrimaryKey,
          'stops': this._shapeFillStops(renderOptions)
        },
        'fill-outline-color': 'rgba(255, 255, 255, 1)'
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

    this._map.setPaintProperty(LAYERS.SHAPE_FILL,
      'fill-color',
      {
        'type': 'categorical',
        'property': renderOptions.shapePrimaryKey,
        'stops': this._shapeFillStops(renderOptions)
      }
    );

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

  _shapeFillStops(renderOptions) {
    return _.map(renderOptions.shapeColorConfigs, (shapeColorConfig) => {
      return [shapeColorConfig.shapeId, shapeColorConfig.color];
    });
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
