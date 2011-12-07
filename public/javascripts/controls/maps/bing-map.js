(function($)
{
    $.Control.registerMixin('bing', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            mapObj._baseLayers = [new OpenLayers.Layer.Bing({
                key: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                transitionEffect: 'resize'
            })];
            mapObj.map.addLayers(mapObj._baseLayers);
        }
    }, {defaultZoom: 13}, 'socrataMap');
})(jQuery);
