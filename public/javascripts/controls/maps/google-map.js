(function($)
{
    blist.openLayers.GeocodeDialog = OpenLayers.Class(OpenLayers.Control, {

        EVENT_TYPES: ['geocoding', 'geocodingdone', 'placepoint'],

        initialize: function(options) {
            this.position = new OpenLayers.Pixel(blist.openLayers.GeocodeDialog.X,
                                                 blist.openLayers.GeocodeDialog.Y);
            this.EVENT_TYPES = blist.openLayers.GeocodeDialog.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
        },

        deactivate: function()
        {
            $('.geolocator_button, .geolocator', this.div).addClass('hide');
        },

        activate: function()
        {
            $('.geolocator_button, .geolocator', this.div).removeClass('hide');
        },
   
        draw: function(px)
        {
            OpenLayers.Control.prototype.draw.apply(this, arguments);
            px = this.position;

            var $geocodeControl = $.tag({ tagName: 'div', 'class': 'geolocator_button',
                title: 'Navigate to location' });
            var $div = $(this.div);
            $div.append($geocodeControl);
            var control = this;
            $geocodeControl.click(function(evt)
            {
                var $geolocator_prompt = $div.find('.geolocator');
                if ($geolocator_prompt.length == 0)
                {
                    $geolocator_prompt = $.tag({ tagName: 'div', 'class': 'geolocator',
                        contents: [{ tagName: 'input', 'class': 'textPrompt', type: 'text' },
                                   { tagName: 'select', contents:
                                       _.map(['auto', '1mi', '2mi', '5mi', '10mi', '20mi', '50mi'],
                                           function(text)
                                           { return { tagName: 'option', contents: text }; })
                                   },
                                   { tagName: 'a', 'class': 'button', contents: 'Go'},
                                   { tagName: 'a', 'class': 'my_location',
                                        title: 'Use current location' },
                                   { tagName: 'div', 'class': 'error' }]
                    });
                    $geolocator_prompt.find('select').uniform();
                    //$geolocator_prompt.css({ left: $geocodeControl.offset().left });
                    var doZoom = function(value)
                    {
                        control.radius = $geolocator_prompt.find('select option:selected').text();
                        if (value.match(/[+-]?\d+\.?\d*,[+-]?\d+\.?\d*/))
                        {
                            var coords = value.split(',');
                            control.geocode({ latlng: { lat: coords[0], lon: coords[1] }});
                        }
                        else
                        { control.geocode({ address: value }); }
                    };

                    $geolocator_prompt.find('input.textPrompt')
                        .example('Enter address here')
                        .keypress(function(evt)
                        { if (evt.which == 13) { doZoom($(this).val()); } });
                    $geolocator_prompt.find('a.my_location').click(function()
                    {
                        control.radius = $geolocator_prompt.find('select option:selected').text();
                        control.geocode();
                    });
                    $geolocator_prompt.find('a.button').click(function()
                    { doZoom($geolocator_prompt.find('input.textPrompt').val()); });
                    $div.append($geolocator_prompt);

                    control.clickout = new OpenLayers.Handler.Click( control, {
                        'click': function(evt) { $geolocator_prompt.hide(); }
                    });
                    control.clickout.activate();
                }
                else
                { $geolocator_prompt.show(); }
            });

            return this.div;
        },

        geocode: function(where)
        {
            var control = this;
            this.errorMessage('');

            if (where && where.radius)
            { this.radius = where.radius; }

            if (where && where.latlng)
            {
                if (!(where.latlng instanceof OpenLayers.LonLat))
                { where.latlng = new OpenLayers.LonLat(where.latlng.lon, where.latlng.lat); }
                this.zoomToLocation(where.latlng);
            }
            else if (where && where.address)
            {
                if (!this.geocoder)
                { this.geocoder = new google.maps.Geocoder(); }
                this.events.triggerEvent('geocoding');
                this.geocoder.geocode({ address: where.address }, function(results, gStatus)
                {
                    control.events.triggerEvent('geocodingdone');
                    switch (gStatus)
                    {
                        case google.maps.GeocoderStatus.OK:
                            var lonlat = results[0].geometry.location;
                            lonlat = new OpenLayers.LonLat(lonlat.lng(), lonlat.lat());

                            var viewport = results[0].geometry.viewport;
                            var sw = viewport.getSouthWest();
                            var ne = viewport.getNorthEast();
                            viewport = new OpenLayers.Bounds(sw.lng(), sw.lat(), ne.lng(), ne.lat());

                            control.zoomToLocation(lonlat, viewport);
                            break;
                        case google.maps.GeocoderStatus.ERROR:
                            control.errorMessage(
                                'The geocoding service is inaccessible. Try again later.');
                            break;
                        case google.maps.GeocoderStatus.ZERO_RESULTS:
                            control.errorMessage(
                                'Unable to geocode. Make sure the address is correct.');
                            break;
                    }
                });
            }
            else // Run off the sensor.
            {
                if (navigator.geolocation)
                {
                    this.events.triggerEvent('geocoding');
                    var timeout = setTimeout(function()
                        { control.events.triggerEvent('geocodingdone'); }, 5000);
                    navigator.geolocation.getCurrentPosition(function(position)
                    {
                        control.events.triggerEvent('geocodingdone');
                        clearTimeout(timeout);
                        control.zoomToLocation(new OpenLayers.LonLat(position.coords.longitude,
                                                                     position.coords.latitude));
                    },
                    function () { control.events.triggerEvent('geocodingdone'); },
                    { enableHighAccuracy: true });
                }
                else if (google.gears)
                {
                    this.events.triggerEvent('geocoding');
                    var timeout = setTimeout(function()
                        { control.events.triggerEvent('geocodingdone'); }, 5000);
                    google.gears.factory.create('beta.geolocation').getCurrentPosition(
                    function(position)
                    {
                        control.events.triggerEvent('geocodingdone');
                        clearTimeout(timeout);
                        control.zoomToLocation(new OpenLayers.LonLat(position.longitude,
                                                                     position.latitude));
                    },
                    function() { control.events.triggerEvent('geocodingdone'); });
                }
            }
        },

        zoomToLocation: function(lonlat, bounds)
        {
            var radius = (this.radius || '').match(/(\d+)(\w+)/), viewport;
            if (radius)
            {
                if (radius[2] == 'mi')
                { radius = parseFloat(radius[1]) * 1609.344; } // Miles to meters.

                var latlng = new google.maps.LatLng(lonlat.lat, lonlat.lon);

                var northBound =
                    google.maps.geometry.spherical.computeOffset(latlng, radius, 0);
                var southBound =
                    google.maps.geometry.spherical.computeOffset(latlng, radius, 180);

                viewport = new OpenLayers.Bounds(latlng.lng() - 0.0001, southBound.lat(),
                                                 latlng.lng() + 0.0001, northBound.lat());
            }

            var lonlat2 = lonlat.clone()
                .transform(new OpenLayers.Projection('EPSG:4326'), this.map.getProjectionObject());
            this.map.setCenter(lonlat2);

            viewport = viewport || bounds;
            if (viewport)
            { this.map.zoomToExtent(viewport.transform(new OpenLayers.Projection('EPSG:4326'),
                                                       this.map.getProjectionObject())); }
            else
            { this.map.zoomTo(17); }

            this.events.triggerEvent('placepoint', { lonlat: lonlat });
        },

        errorMessage: function(msg)
        {
            $(this.div).find('div.error').html(msg);
        },

        CLASS_NAME: "blist.openLayers.GeocodeDialog"
    });

    blist.openLayers.GeocodeDialog.X = 45;
    blist.openLayers.GeocodeDialog.Y = 4;

    $.Control.registerMixin('google', {
        initializeBaseLayers: function()
        {
            var mapObj = this;

            OpenLayers.Layer.Google.v3.repositionMapElements = function() {};

            var mtSwitcher = mapObj.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0]
                .registerMapType('Satellite', new OpenLayers.Layer.Google('Google Satellite',
                    { isBaseLayer: true, type: google.maps.MapTypeId.SATELLITE }))
                .registerMapType('Terrain', new OpenLayers.Layer.Google('Google Terrain',
                    { isBaseLayer: true, type: google.maps.MapTypeId.TERRAIN }));

            mapObj._baseLayers = [new OpenLayers.Layer.Google('Google Roadmap',
                { isBaseLayer: true })];
            mtSwitcher.registerMapType('Roadmap', mapObj._baseLayers[0]);
            mapObj.map.addLayers(mapObj._baseLayers);

            // loadend check is in adjustBounds, because GMaps likes to be special.
            mapObj._mapElementsLoading++;
        },

        adjustBounds: function()
        {
            var mapObj = this;
            mapObj._super();

            if (mapObj._mapElementsLoading > 0)
            {
                var listener = google.maps.event.addListener(mapObj._baseLayers[0].mapObject,
                    'tilesloaded', function()
                {
                    mapObj.mapElementLoaded();
                    google.maps.event.removeListener(listener);
                });
            }
        }
    }, { defaultZoom: 13 }, 'socrataMap');

})(jQuery);
