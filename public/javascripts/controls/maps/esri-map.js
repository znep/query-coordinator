(function($)
{
    $.Control.registerMixin('esri', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            mapObj._baseLayers = _.map(mapObj._displayFormat.layers || mapObj.settings.defaultLayers,
                function(layer, i)
                {
                    var name = layer.url.match(/services\/([A-Za-z0-9_]+)\/MapServer/)[1]
                        .replace(/_/g, ' ');
                    var baseLayer = new OpenLayers.Layer.ArcGISCache(name, layer.url, {
                        isBaseLayer: i == 0,
                        url: layer.url,
                        opacity: (layer.options || {}).opacity || 1.0,
                        projection: 'EPSG:102100',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(-20037508.342787, 20037508.342787),
                        maxExtent: new OpenLayers.Bounds(-20037508.34, -19971868.8804086,
                                                          20037508.34,  19971868.8804086),
                        transitionEffect: 'resize'
                    });
                    mapObj.map.addLayer(baseLayer);
                    mapObj.map.setLayerIndex(baseLayer, i);
                    return baseLayer;
                });
        }
    }, {
        defaultLayers: [{type:'tile', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'}],
        defaultZoom: 11
    }, 'socrataMap');
})(jQuery);
