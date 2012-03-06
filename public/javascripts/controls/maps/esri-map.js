(function($)
{
    $.Control.registerMixin('esri', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            mapObj._baseLayers = _.map(mapObj._displayFormat.layers || mapObj.settings.defaultLayers,
                function(layer, i)
                {
                    var url = layer.custom_url || layer.url;
                    url = url.replace(/\/$/, '');
                    var name = url.match(/\/([A-Za-z0-9_]+)\/MapServer/)[1].replace(/_/g, ' ');
                    var baseLayer = new OpenLayers.Layer.ArcGISCache(name, url, {
                        isBaseLayer: i == 0,
                        url: url,
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

            mapObj._mapElementsLoading += mapObj._baseLayers.length;
            _.each(mapObj._baseLayers, function(layer)
            { layer.events.register('loadend', mapObj, mapObj.mapElementLoaded); });
        }
    }, {
        defaultLayers: [{type:'tile', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'}],
        defaultZoom: 11
    }, 'socrataMap');
})(jQuery);
