import _ from 'lodash';

const SOURCES = Object.freeze({
  POINTS_AND_STACKS: 'pointVectorDataSource'
});

const LAYERS = Object.freeze({
  STACK_CIRCLE: 'stack-circle',
  STACK_COUNT_LABEL: 'stack-count-label',
  POINT: 'point'
});

export default class PointsAndStacks {
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
    this._map.addSource(SOURCES.POINTS_AND_STACKS, this._sourceOptions(vif, renderOptions));

    this._map.addLayer({
      'id': LAYERS.STACK_CIRCLE,
      'type': 'circle',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['any', ['has', 'point_count'], ['!in', renderOptions.countBy, 1, '1']],
      'paint': {
        'circle-radius': renderOptions.layerStyles.STACK_SIZE / 2,
        'circle-color': renderOptions.layerStyles.STACK_COLOR,
        'circle-stroke-width': renderOptions.layerStyles.STACK_BORDER_SIZE,
        'circle-stroke-color': renderOptions.layerStyles.STACK_BORDER_COLOR,
        'circle-stroke-opacity': renderOptions.layerStyles.STACK_BORDER_OPACITY
      }
    });

    this._map.addLayer({
      id: LAYERS.STACK_COUNT_LABEL,
      type: 'symbol',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['any', ['has', 'point_count'], ['!in', renderOptions.countBy, 1, '1']],
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
        'text-color': renderOptions.layerStyles.STACK_TEXT_COLOR
      }
    });

    this._map.addLayer({
      id: LAYERS.POINT,
      type: 'circle',
      'source': SOURCES.POINTS_AND_STACKS,
      'source-layer': '_geojsonTileLayer',
      'filter': ['all', ['!has', 'point_count'], ['in', renderOptions.countBy, 1, '1']],
      'paint': {
        'circle-radius': vif.getPointCircleRadius(renderOptions.resizeByRange, renderOptions.aggregateAndResizeBy),
        'circle-color': vif.getPointColor(renderOptions.colorBy, renderOptions.colorByCategories),
        'circle-opacity': vif.getPointOpacity()
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

    // Updating point color/radius based on new vif
    this._map.setFilter(LAYERS.POINT,
      ['all', ['!has', 'point_count'], ['in', renderOptions.countBy, 1, '1']]);
    this._map.setPaintProperty(LAYERS.POINT,
      'circle-color',
      vif.getPointColor(renderOptions.colorBy, renderOptions.colorByCategories));
    this._map.setPaintProperty(LAYERS.POINT,
      'circle-radius',
      vif.getPointCircleRadius(renderOptions.resizeByRange, renderOptions.aggregateAndResizeBy));
    this._map.setPaintProperty(LAYERS.POINT,
      'circle-opacity',
      vif.getPointOpacity());

    // Updating stack look and feel based on new base-map-style in vif
    this._map.setPaintProperty(LAYERS.STACK_CIRCLE,
      'circle-radius',
      renderOptions.layerStyles.STACK_SIZE / 2);
    this._map.setPaintProperty(LAYERS.STACK_CIRCLE,
      'circle-color',
      renderOptions.layerStyles.STACK_COLOR);
    this._map.setPaintProperty(LAYERS.STACK_CIRCLE,
      'circle-stroke-width',
      renderOptions.layerStyles.STACK_BORDER_SIZE);
    this._map.setPaintProperty(LAYERS.STACK_CIRCLE,
      'circle-stroke-color',
      renderOptions.layerStyles.STACK_BORDER_COLOR);
    this._map.setPaintProperty(LAYERS.STACK_CIRCLE,
      'circle-stroke-opacity',
      renderOptions.layerStyles.STACK_BORDER_OPACITY);
    this._map.setPaintProperty(LAYERS.STACK_COUNT_LABEL,
      'text-color',
      renderOptions.layerStyles.STACK_TEXT_COLOR);

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
      'clusterRadius': vif.getStackRadius(),
      'aggregateBy': renderOptions.aggregateAndResizeBy,
      'tiles': [renderOptions.dataUrl],
      'minzoom': vif.getMaxClusteringZoomLevel() + 1
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
