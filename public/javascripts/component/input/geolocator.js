$.component.Component.extend('Geolocator', 'none', {//'input', {
    _needsOwnContext: true,

    _init: function()
    {
        this._super.apply(this, arguments);
        this.registerEvent({'geolocate': ['where']});
    },

    _getAssets: function()
    {
        return { stylesheets: [
                {assets: 'display-map'},
                {assets: 'render-images-bundle', hasImages: true}
        ] };
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        if ($.isBlank(cObj.$geolocator))
        {
            // TODO: localize 'auto'
            var radiusOptions = cObj._properties.radiusOptions
                || ['auto', '1mi', '2mi', '5mi', '10mi', '20mi', '50mi'];
            cObj.$geolocator = $.tag({ tagName: 'div', 'class': 'geolocator clearfix',
                contents: [{ tagName: 'input', 'class': 'textPrompt', type: 'text' },
                           { tagName: 'select', contents:
                               _.map(radiusOptions,
                                   function(text)
                                   { return { tagName: 'option', contents: text }; })
                           },
                           { tagName: 'a', 'class': 'button', contents: 'Go'},
                           { tagName: 'a', 'class': 'my_location',
                                title: 'Use current location' },
                           { tagName: 'div', 'class': 'error' }]
            });
            cObj.$geolocator.find('select').uniform();
            cObj.$contents.append(cObj.$geolocator);
        }

        if (!cObj._eventsBound)
        {
            cObj._eventsBound = true;

            cObj.$contents.find('input.textPrompt').example('Enter address here');
            cObj.$contents.delegate('input.textPrompt', 'keypress', function(e)
            { if (e.which == 13) { doZoom(cObj, $(this).val()); } });
            cObj.$contents.delegate('a.button', 'click', function(e)
            { doZoom(cObj, cObj.$contents.find('input.textPrompt').val()); });
            cObj.$contents.delegate('a.my_location', 'click', function(e)
            { doZoom(cObj); });
        }

        return true;
    }
});

var doZoom = function(cObj, value)
{
    var where = { radius: cObj.$contents.find('select option:selected').text() };
    if (value)
    {
        if (value.match(/[+-]?\d+\.?\d*,[+-]?\d+\.?\d*/))
        {
            var coords = value.split(',');
            where.latlng = { lat: coords[0], lon: coords[1] };
        }
        else
        { where.address = value; }
    }
    if (cObj._properties.restrictedBounds)
    { $.extend(where, { bounds: cObj._properties.restrictedBounds }); }
    cObj.trigger('geolocate', [{ where: where }]);
};
