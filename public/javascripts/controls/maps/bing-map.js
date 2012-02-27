(function($)
{
    $.Control.registerMixin('bing', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            var options = {
                key: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                transitionEffect: 'resize'
            };

            var mtSwitcher = mapObj.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0]
                .registerMapType('Aerial', new OpenLayers.Layer.Bing($.extend({}, options, { type: 'Aerial' })));

            mapObj._baseLayers = [new OpenLayers.Layer.Bing(options)];
            mtSwitcher.registerMapType('Road', mapObj._baseLayers[0]);
            mapObj.map.addLayers(mapObj._baseLayers);
        }
    }, {defaultZoom: 13}, 'socrataMap');
})(jQuery);
