(function($)
{
    blist.namespace.fetch('blist.openLayers');

    Proj4js.defs["EPSG:102100"] = "+proj=merc +lon_0=0 +x_0=0 +y_0=0 +a=6378137 +b=6378137  +units=m +nadgrids=@null";

    blist.openLayers.geographicProjection = new OpenLayers.Projection('EPSG:4326');
    blist.openLayers.backgroundLayerTypes = [
        OpenLayers.Layer.Bing, OpenLayers.Layer.ArcGISCache, OpenLayers.Layer.Google
    ];

    blist.openLayers.isBackgroundLayer = function(layer)
    { return _.any(blist.openLayers.backgroundLayerTypes,
        function(layerType) { return layer instanceof layerType; }); };

    blist.openLayers.GeocodeDialog = OpenLayers.Class(OpenLayers.Control, {

        EVENT_TYPES: ['geocoding', 'geocodingdone'],

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
                var request = { address: where.address };
                if (where.bounds)
                {
                    requestr.bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(where.bounds.ymin,where.bounds.xmin),
                        new google.maps.LatLng(where.bounds.ymax,where.bounds.xmax));
                }
                this.geocoder.geocode(request, function(results, gStatus)
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

            lonlat.transform(blist.openLayers.geographicProjection, this.map.getProjectionObject());
            this.map.setCenter(lonlat);

            viewport = viewport || bounds;
            if (viewport)
            { this.map.zoomToExtent(viewport.transform(new OpenLayers.Projection('EPSG:4326'),
                                                       this.map.getProjectionObject())); }
            else
            { this.map.zoomTo(17); }

            if (!this._layer)
            { this.map.addLayer(this._layer = new OpenLayers.Layer.Vector('Geolocator')); }
            if (!this._feature)
            {
                this._layer.addFeatures(
                    [this._feature = new OpenLayers.Feature.Vector(lonlat.toGeometry())]);

                this._feature.style = this.map.getControlsByClass('blist.openLayers.IconCache')[0]
                    .fetch('/images/pin.png', this._feature, false);
            }
            else
            {
                this._feature.geometry = lonlat.toGeometry();
                this._layer.drawFeature(this._feature);
            }
        },

        errorMessage: function(msg)
        {
            $(this.div).find('div.error').html(msg);
        },

        CLASS_NAME: "blist.openLayers.GeocodeDialog"
    });

    blist.openLayers.GeocodeDialog.X = 45;
    blist.openLayers.GeocodeDialog.Y = 4;

    blist.openLayers.MapTypeSwitcher = OpenLayers.Class(OpenLayers.Control, {

        EVENT_TYPES: ['maptypechange'],

        initialize: function()
        {
            this.layers = {};
            this.EVENT_TYPES = blist.openLayers.MapTypeSwitcher.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
        },

        setMap: function()
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);

            this.map.events.on({
                scope: this,
                'changebaselayer': this.redraw
            });
        },

        destroy: function()
        {
            $(this.map.div).siblings('.mapTypes').empty();
            this.map.events.un({ 'changebaselayer': this.redraw });
            OpenLayers.Control.prototype.destroy.apply(this, arguments);
        },

        activate: function()
        {
            this.active = true;
            $(this.map.div).siblings('.mapTypes').show();
        },

        deactivate: function()
        {
            this.active = false;
            $(this.map.div).siblings('.mapTypes').hide();
        },

        redraw: function(evtObj)
        {
            var _this = this;
            if (!this.active) { return; }
            if (evtObj)
            {
                _.each(this.layers, function(layer, maptype)
                {
                    if (evtObj.layer == layer)
                    { _this.currentMapType = maptype; }
                });
            }
            this.draw();
        },

        draw: function(px)
        {
            if (this.map.hasNoBackground || _.isEmpty(this.layers)) { return; }

            var $dom = $(this.map.div).siblings('.mapTypes');
            if ($dom.length == 0)
            {
                $(this.map.div).before('<div class="mapTypes"></div>');
                $dom = $(this.map.div).siblings('.mapTypes');
            }

            $dom.show().empty();
            var _this = this;
            _.each(_.keys(this.layers), function(maptype)
            {
                $dom.append('<a'
                    + (maptype == _this.currentMapType ? ' class="current"' : '')
                    +'>' + maptype + '</a>');
            });
            $dom.on('click', 'a', function() { _this.switchMapType($(this).text()); });
        },

        registerMapType: function(maptype, layer)
        {
            this.layers[maptype] = layer;
            this.redraw();
            return this;
        },

        clearMapTypes: function()
        {
            this.layers = {};
            return this;
        },

        switchMapType: function(maptype)
        {
            if (maptype == this.currentMapType) { return; }
            if (this.map.getLayerIndex(this.layers[maptype]) == -1)
            { this.map.addLayers([this.layers[maptype]]); }
            this.events.triggerEvent('maptypechange');
            this.map.setBaseLayer(this.layers[maptype]);
        },

        CLASS_NAME: 'blist.openLayers.MapTypeSwitcher'
    });

    blist.openLayers.ZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, {
        destroy: function()
        {
            if (this.sliderEvents)
            { OpenLayers.Control.PanZoomBar.prototype.destroy.apply(this, arguments); return; }

            this.map.events.un({
                "changebaselayer": this.redraw,
                scope: this
            });

            OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);

            delete this.mouseDragStart;
            delete this.zoomStart;
        },

        redraw: function()
        {
            if (this.div != null)
            {
                this.removeButtons();
                if (this.sliderEvents && !this.small) { this._removeZoomBar(); }
            }

            var numZoomLevels = $.deepGetStringField(this, 'map.baseLayer.numZoomLevels');

            // Magic number: height that we want the zoombarDiv to be at.
            // Calculated as zoom_gutter.png (277) minus button heights (21) minus padding (2)
            // 277 - (2*21) - (2*2) = 231
            if (numZoomLevels)
            { this.zoomStopHeight = 231 / numZoomLevels; }
            this.draw();
        },

        draw: function(px)
        {
            // derived from PanZoomBar source, because it's the only way to change
            // these sizes. because of course.

            OpenLayers.Control.prototype.draw.apply(this, arguments);
            px = this.position.clone();
            this.buttons = [];

            var padding = new OpenLayers.Size(-2, -2);

            // Magic number is height as specified in openlayers.sass.
            this.small = $(this.map.div).height() < 277;

            // HACK HACK HACK HACK HCAK HCAK HCAKHCAKHC AKHACKHAC HKACK HACKH ACHKACHK
            var sz = new OpenLayers.Size(21, 21);
            this._addButton('zoomin', 'zoom-plus-mini.png', px.add(padding.w, padding.h), sz);
            if (this.small)
            {
                $(this.div).addClass('small');
                this._addButton('zoomout', 'zoom-minus-mini.png',
                    px.add(padding.w, padding.h + 19), sz);
            }
            else
            {
                $(this.div).removeClass('small');
                var centered = this._addZoomBar(px.add(padding.w + 1, padding.h + 19));
                this._addButton('zoomout', 'zoom-minus-mini.png', centered.add(-1, 2), sz);
            }

            return this.div;
        },

        moveZoomBar: function()
        {
            var numZoomLevels = this.map.currentMaxZoomLevel();
            var zoomStopHeight = 231 / numZoomLevels;
            var newTop = ((numZoomLevels-1) - this.map.getZoom())
                * zoomStopHeight + this.startTop + 1;
            this.slider.style.top = newTop + 'px';
        },

        CLASS_NAME: "blist.openLayers.ZoomBar"
    });

    blist.openLayers.Attribution = OpenLayers.Class(OpenLayers.Control.Attribution, {
        initialize: function()
        {
            this.EVENT_TYPES = ['attributionupdated'].concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.Attribution.prototype.initialize.apply(this, arguments);
        },

        updateAttribution: function()
        {
            var control = this;
            OpenLayers.Control.Attribution.prototype.updateAttribution.apply(this, arguments);

            var imgs = this.div.getElementsByTagName('img');
            var toLoad = imgs.length;
            for (var i = 0; i < toLoad; i++)
            { imgs[i].onload = function() {
                toLoad--;
                if (toLoad == 0)
                { control.events.triggerEvent('attributionupdated'); }
            }; }
            if (toLoad == 0)
            { this.events.triggerEvent('attributionupdated'); }
        }
    });

    blist.openLayers.Map = OpenLayers.Class(OpenLayers.Map, {
        initialize: function(div, options)
        {
            options.controls = [
                new blist.openLayers.Attribution(),
                new blist.openLayers.MapTypeSwitcher(),
                new blist.openLayers.Overview(),
                new blist.openLayers.GeocodeDialog(),
                new blist.openLayers.IconCache()
            ];

            if (!options.disableNavigation)
            {
                options.controls.push(new OpenLayers.Control.Navigation());
                options.controls.push(new blist.openLayers.ZoomBar());
            }

            if (window.location.href.indexOf('watercolor') > -1)
            { options.controls.push(new blist.openLayers.StamenControl()); }

            // call the default constructor but with no theme or controls; we'll add our own
            OpenLayers.Map.prototype.initialize.apply(this, [div, options]);
        },

        setNoBackground: function(toggle)
        {
            this.hasNoBackground = _.isUndefined(toggle) ? true : toggle;
        },

        backgroundLayers: function()
        {
            return _.select(this.layers, function(layer)
                { return blist.openLayers.isBackgroundLayer(layer); });
        },

        currentMaxZoomLevel: function()
        {
            if (this.hasNoBackground) { return this.baseLayer.availableZoomLevels; }
            return _(this.backgroundLayers()).chain()
                .select(function(layer) { return layer.visibility; })
                .pluck('availableZoomLevels')
                .max().value();
        },

        isValidZoomLevel: function(zoomLevel)
        {
            return !_.isUndefined(zoomLevel)
                && zoomLevel > 0
                && (this.hasNoBackground || zoomLevel < this.currentMaxZoomLevel());
        },

        restrictPanningTo: function(extent)
        {
            extent = extent.clone().intersection(OpenLayers.Bounds.fromArray(
                [-179.999999, -85.051128, 179.999999, 85.051128]).transform(
                blist.openLayers.geographicProjection, this.getProjectionObject()));
            this.restrictedExtent = extent;
        },

        showMousePosition: function()
        {
            if (this.getControlsByClass('OpenLayers.Control.MousePosition').length == 0)
            { this.addControl(new OpenLayers.Control.MousePosition()); }
        }

        // I've left this untested despite it being necessary due to restrictedExtent.
        // It may become necessary when we turn that off.
        /*
        zoomToExtent: function(extent)
        {
            // Hack: zoomToExtent's getCenterLonLat goes nuts if it tries to capture an
            // extent that goes past the dateline. This triggers an if-statement inside.
            var tmp = this.baseLayer.wrapDateLine;
            this.baseLayer.wrapDateLine = true;
            OpenLayers.Map.prototype.zoomToExtent.apply(this, arguments);
            this.baseLayer.wrapDateLine = tmp;
        }
        */
    });

    blist.openLayers.Overview = OpenLayers.Class(OpenLayers.Control, {

        EVENT_TYPES: [],

        initialize: function()
        {
            this.EVENT_TYPES = blist.openLayers.Overview.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
            this._dataLayers = [];
        },

        setMap: function(map)
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);

            this.mtSwitcher = this.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0];
            this.map.events.on({
                'changebaselayer': this.redraw,
                'addlayer': this.redraw,
                'removelayer': this.redraw,
                scope: this
            });
        },

        draw: function()
        {
            var $dom = $(this.map.div);
            if ($dom.siblings('.mapLayers').length < 1)
            {
                $dom.before('<div class="mapLayers" class="commonForm">' +
                    '<a href="#toggleLayers" class="toggleLayers">' +
                    'Layer Summary' +
                    '</a>' +
                    '<div class="contentBlock hide">' +
                    '<div class="layerOrder">(Bottom)</div>' +
                    '<h3 class="base">Base Layers</h3><ul class="base"></ul>' +
                    '<h3 class="data">Data Layers</h3><ul class="data"></ul>' +
                    '<ul class="feature"></ul>' +
                    '<div class="layerOrder">(Top)</div>' +
                    '</div>' +
                    '</div>');
                $dom.siblings('.mapLayers').find('a.toggleLayers')
                    .click(function(e)
                    {
                        e.preventDefault();
                        $dom.siblings('.mapLayers')
                            .find('.contentBlock').toggleClass('hide');
                    });
            }
            if ($dom.siblings('.mapLegend').length < 1)
            {
                $dom.before('<div class="mapLegend hide">' +
                    '<div class="contentBlock">' +
                    '</div>' +
                    '</div>');
            }
        },

        // Consider being more incisive? Parameter: `evt.layer`.
        redraw: function(evtObj)
        {
            var control = this;
            if (control._handlingEvent == 'changebaselayer') { return; }

            var $dom = $(this.map.div).siblings('.mapLayers');
            var backgroundLayers = this.exclusiveLayers ? _.values(this.mtSwitcher.layers)
                                                        : this.map.backgroundLayers();
            if (control.map.hasNoBackground) { backgroundLayers = []; }

            $dom.find('ul').empty();
            $(this.map.div).siblings('.mapLegend').empty();

            $dom.find('.base').toggle(backgroundLayers.length > 0);
            $dom.find('.data').toggle(this._dataLayers.length > 0);

            _.each(backgroundLayers, function(l) { control.renderBackgroundLayer($dom, l); });
            _.each(this._dataLayers, function(l) { control.renderDataLayer($dom, l); });

            $dom.find(':checkbox').click(function(e)
            {
                var $check = $(e.currentTarget);
                var layer = $check.parent().data('layer')
                layer.setVisibility($check.value());

                if (layer.visibility)
                { delete layer.hiddenByUser; }
                else
                { layer.hiddenByUser = true; }
            });

            $dom.find(':radio').click(function(e)
            {
                var $check = $(e.currentTarget);
                var layer = $check.parent().data('layer');
                if (control.map.getLayerIndex(layer) == -1)
                { control.map.addLayers([layer]); }
                control.map.setBaseLayer(layer);
            });

            $dom.find('.sliderControl').each(function()
            {
                var $slider = $(this);
                $slider.slider({min: parseInt($slider.attr('data-min')),
                    max: parseInt($slider.attr('data-max')),
                    value: parseInt($slider.attr('data-origvalue'))});
                $slider.after($.tag(
                    {tagName: 'input', type: 'text',
                    value: $slider.attr('data-origvalue'),
                    readonly: true, 'class': 'sliderInput'}
                , true));
                $slider.bind('slide', function(event, ui)
                {
                    var $_this = $(this);
                    var layer = $_this.parent().data('layer')
                    var newOpacity = ui.value/100;
                    layer.setOpacity(newOpacity);
                    $_this.next(':input').val(ui.value);
                });
            });

            var reorderLayers = function(event, ui)
            {
                control._handlingEvent = 'changebaselayer';
                var layer = $(ui.item).data('layer');
                if (!layer) { return; }
                var index = $dom.find('ul li').index(ui.item);

                var oldBaseLayer, newBaseLayer;
                if (index == 0)
                { oldBaseLayer = control.map.baseLayer; newBaseLayer = layer; }
                else if (control.map.getLayerIndex(layer) == 0)
                { oldBaseLayer = control.map.layers[0]; newBaseLayer = control.map.layers[1]; }

                if (oldBaseLayer && newBaseLayer)
                {
                    control.map.setBaseLayer(newBaseLayer);
                    newBaseLayer.setIsBaseLayer(true);
                    oldBaseLayer.setIsBaseLayer(false);
                    oldBaseLayer.setVisibility(true);
                }
                control.map.setLayerIndex(layer, index);
                delete control._handlingEvent;
            };

            if (!this.exclusiveLayers)
            { $dom.find('ul.base').sortable({containment: 'parent',
                    placeholder: 'ui-state-highlight',
                    forcePlaceholderSize: true, tolerance: 'pointer',
                    update: reorderLayers, cancel: 'a.ui-slider-handle'
                }); }

            // Create separator if there is something to separate.
            if ($dom.find('ul.data, ul.feature').filter(':visible').hasChildren())
            { $dom.find('ul.data').css('border-bottom', 'dashed 1px #eee'); }
            else
            { $dom.find('ul.data').css('border-bottom', 'none'); }

            this.correctHeight();
        },

        renderBackgroundLayer: function($dom, layer)
        {
            var lId = 'mapLayer_' + layer.name;
            var opacity = _.isNull(layer.opacity) ? 1 : layer.opacity;
            var $layerSet = $dom.find('ul.base');
            var radio = 'radio" name="backgroundLayers';
            var checked = ' checked="checked"';

            if (   (!this.exclusiveLayers && !layer.visibility)
                || ( this.exclusiveLayers && this.map.baseLayer != layer))
            { checked = ''; }

            var layerName = $.isBlank(layer.alias) ? layer.name : layer.alias;
            $layerSet.append('<li data-layerid="' + layer.id + '"' +
                '><input type="' + (this.exclusiveLayers ? radio : 'checkbox') +
                '" id="' + lId + '"' + checked +
                ' /><label for="' + lId + '">' + layerName + '</label>' +
                '<br /><span class="sliderControl" data-min="0" data-max="100" ' +
                'data-origvalue="' + (opacity*100) + '" />' +
                '</li>');
            $layerSet.find('li:last').data('layer', layer);
        },

        truncate: function(length)
        {
            this._dataLayers = this._dataLayers.slice(0, length);
            this.redraw();
        },

        registerDataLayer: function(layerObj, index)
        {
            this._dataLayers[index] = layerObj;
            this.redraw();
        },

        renderDataLayer: function($dom, layerObj)
        {
            var control = this;
            var dataLayers = _($.makeArray(layerObj.dataLayers())).chain()
                .flatten().compact().value();

            var typeMap = {
                'point': 'Point Map',
                'heatmap': 'Boundary Map',
                'rastermap': 'Heat Map'
            };

            _.each(dataLayers, function(layer)
            {
                var $layerSet = layer instanceof OpenLayers.Layer.Vector ? $dom.find('ul.feature')
                                                                         : $dom.find('ul.data');
                var lId = 'mapLayer_' + layer.name;
                var opacity = _.isNull(layer.opacity) ? 1 : layer.opacity;
                var layerName = layer.name;
                var layerType = typeMap[layerObj._displayFormat.plotStyle]
                if (layerType) { layerType = ' title="' + layerType + '"'; }
                if (dataLayers.length > 1)
                { layerName += ' (of ' + layerObj._view.name + ')'; }
                $layerSet.append('<li data-layerid="' + layer.id + '"' +
                    '><input type="checkbox" id="' + lId + '"' +
                    (layer.visibility ? ' checked="checked"' : '') +
                    ' /><label for="' + lId + '"' + layerType + '>' + layerName + '</label>' +
                    '<br /><span class="sliderControl" data-min="0" data-max="100" ' +
                    'data-origvalue="' + (opacity*100) + '" />' +
                    '</li>');
                var $layerLI = $layerSet.find('li:last');
                $layerLI.data('layer', layer);

                control.renderLegend($dom, layerObj);
            });
        },

        enableLegend: function()
        {
            this._enableLegend = true;
            this._drawn = false;
            this.redraw();
        },

        disableLegend: function()
        {
            this._enableLegend = false;
            this._drawn = false;
            $(this.map.div).siblings('.mapLegend').addClass('hide');
            this.redraw();
        },

        renderLegend: function($dom, layerObj)
        {
            var legendData = layerObj.legendData();
            if (!legendData) { return; }

            var $container = this._enableLegend ? $(this.map.div).siblings('.mapLegend')
                                                : $dom.find('ul.feature li:last');

            var totalWidth = legendData.gradient.length * blist.openLayers.Overview.SWATCH_WIDTH;
            var numWidth = (totalWidth - 10) / 2;

            var contents = { tagName: 'div',
                style: { 'width':  totalWidth + 'px', overflow: 'hidden' }, contents: [
                    { tagName: 'ul' },
                    { tagName: 'span', contents: legendData.minimum },
                    { tagName: 'span', style: { 'text-align': 'right', 'float': 'right' },
                        contents: legendData.maximum }
                ]
            };

            var $legend;
            if (this._enableLegend)
            { $legend = $.tag({ tagName: 'div', contents: [
                { tagName: 'h3', 'class': 'label', contents: legendData.name }, contents ]}); }
            else
            { $legend = $.tag({ tagName: 'div', 'class': 'layerLegend', contents: [
                { tagName: 'span', 'class': 'label', contents: legendData.name }, contents ]}); }

            $legend.find('> div span').css('width', numWidth + 'px');
            var $ul = $legend.find('ul');
            _.each(legendData.gradient, function(segment, index)
            {
                var valueRange = [index == 0 ? legendData.minimum
                                             : legendData.gradient[index-1].value,
                                  ' - ', segment.value].join('');
                $ul.append(
                    $("<div class='color_swatch'><div class='inner'>&nbsp;</div></div>")
                        .css('background-color', segment.color)
                        .attr('title', valueRange)
                    );
            });
            $container.append($legend);

            if (!this._drawn)
            {
                if (this._enableLegend)
                { $container.removeClass('hide'); }
                else
                { $container.parents('.contentBlock').removeClass('hide'); }
                this._drawn = true;
            }
        },

        resetBackground: function()
        {
            if (!this.exclusiveLayers) { return; }
            var $dom = $(this.map.div).siblings('.mapLayers');
            $dom.find('ul.base li:first input:radio').attr('checked', 'checked');
            this.map.setBaseLayer(this.map.backgroundLayers()[0])
        },

        open: function()
        {
            $(this.map.div).siblings('.mapLayers').find('.contentBlock').removeClass('hide');
        },

        close: function()
        {
            $(this.map.div).siblings('.mapLayers').find('.contentBlock').addClass('hide');
        },

        correctHeight: function()
        {
            var $div = $(this.map.div);
            var $layers = $div.siblings('.mapLayers');
            var $bottom = $(this.map.getControlsByClass('OpenLayers.Control.Attribution')[0].div);
            var height = ($bottom.filter(':visible').length == 0)
                ? $div.height() - 20 : $bottom.position().top - 10;
            height -= $layers.position().top + $layers.padding().top + $layers.padding().bottom;
            $layers.css('max-height', height);
            $layers.find('.contentBlock').css({
                'max-height': height-(2 * $layers.find('.toggleLayers').height()),
                'overflow': 'auto'});
        },

        CLASS_NAME: 'blist.openLayers.Overview'
    });

    blist.openLayers.Overview.SWATCH_WIDTH = 15;

    blist.openLayers.IconCache = OpenLayers.Class(OpenLayers.Control, {
        initialize: function()
        {
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
            this.cache = {};
        },

        fetch: function(url, feature, hasHighlight)
        {
            var control = this;

            if (!url)
            { url = '/images/openlayers/marker.png'; }

            var key = url;
            if (hasHighlight) { key += '|highlight=true'; }

            if (!this.cache[key])
            {
                this.cache[key] = { externalGraphic: url, features: [] };
                var image = new Image();
                image.onload = function()
                {
                    var sf = blist.openLayers.IconCache.iconScaleFactor;
                    var width = hasHighlight ? image.width * sf : image.width;
                    var height = hasHighlight ? image.height * sf : image.height;

                    $.extend(control.cache[key], {
                        graphicWidth: width, graphicHeight: height,
                        graphicXOffset: -(width / 2), graphicYOffset: -height
                    });

                    if (hasHighlight)
                    { control.cache[key].hasHighlight = true; }

                    var features = control.cache[key].features.concat(feature);
                    _.each(features, function(f)
                    {
                        f.style = control.cache[key];
                        if (f.layer) { f.layer.drawFeature(f); }
                    });
                    control.cache[key].features = [];
                };
                image.src = url;
            }
            else
            { this.cache[key].features.push(feature); }

            return this.cache[key];
        },

        CLASS_NAME: 'blist.openLayers.IconCache'
    });

    blist.openLayers.IconCache.iconScaleFactor = 1.2;

    blist.openLayers.Cluster = OpenLayers.Class(OpenLayers.Feature.Vector, {
        initialize: function(geometry, cluster_data)
        {
            var cluster_icon = '/images/map_cluster_';
            var size;
            var count = cluster_data.size;
            if (count < 100)
            { cluster_icon += 'small.png'; size = 37; }
            else if (count < 1000)
            { cluster_icon += 'med.png';   size = 45; }
            else
            { cluster_icon += 'large.png'; size = 65; }

            var style = { externalGraphic: cluster_icon,
                  graphicWidth: size, graphicHeight: size,
                  graphicXOffset: -(size/2), graphicYOffset: -(size/2),
                  label: ''+count };
            if (!cluster_data.forever) { style.cursor = 'pointer'; }

            OpenLayers.Feature.Vector.prototype.initialize.apply(this,
                [geometry, cluster_data, style]);
        },

        boundary: function()
        {
            if (this.boundaries) { return this.boundaries; }

            var boundary = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(
                    _.map(this.attributes.polygon, function(vertex)
                    { return new OpenLayers.Geometry.Point(vertex.lon, vertex.lat); }))])
                .transform(blist.openLayers.geographicProjection,
                           this.attributes.mapProjection),
                {},
                { fillColor: '#0000dd', fillOpacity: 0.2, strokeWidth: 3, strokeColor: '#000088' });

            // If the size of the bbox is small or thin, don't bother.
            var nwPixel = this.layer.getViewPortPxFromLonLat(
                new OpenLayers.LonLat(this.attributes.box.lon1, this.attributes.box.lat1).transform(
                    blist.openLayers.geographicProjection, this.attributes.mapProjection));
            var sePixel = this.layer.getViewPortPxFromLonLat(
                new OpenLayers.LonLat(this.attributes.box.lon2, this.attributes.box.lat2).transform(
                    blist.openLayers.geographicProjection, this.attributes.mapProjection));
            var bboxWidth  = Math.abs(sePixel.x - nwPixel.x);
            var bboxHeight = Math.abs(sePixel.y - nwPixel.y);
            this.attributes.bboxArea = bboxWidth * bboxHeight;
            this.attributes.bboxRatio = bboxWidth / bboxHeight;

            // If there are no children, just use the provided polygon.
            if (_.isEmpty(this.attributes.children))
            {
                if (bboxWidth < this.style.graphicWidth && bboxHeight < this.style.graphicHeight)
                { this.translucentOnHover = true; }
                this.boundaries = [boundary];
                return this.boundaries;
            }

            // This catches 1-point clusters, too, which are of area 0 and ratio NaN.
            // Current role model for "too big" is USGS Earthquakes, Carribean 55-point cluster.
            if (this.attributes.bboxArea < 100000)
            { this.boundaries = [boundary]; return this.boundaries; }
            if (this.attributes.bboxRatio < 0.01)
            { this.boundaries = [boundary]; return this.boundaries; }

            // Alright, build from child boxes.
            var mapProjection = this.attributes.mapProjection;
            this.boundaries = _.map(this.attributes.children, function(child)
            {
                var box = child.box;
                var bbox = OpenLayers.Bounds.fromClusterBox(box)
                    .transform(blist.openLayers.geographicProjection, mapProjection);
                return new OpenLayers.Feature.Vector(bbox.toGeometry(), {},
                    { fillColor: '#00dd00', fillOpacity: 0.2,
                      strokeWidth: 2, strokeColor: '#008800'  });
            });

            // And add some lines.
            var lonlat = this.geometry.toLonLat();
            var lines = new OpenLayers.Geometry.MultiLineString(_.map(this.boundaries,
                function(child)
                {
                    var childCenter = child.geometry.getBounds().getCenterLonLat();
                    return new OpenLayers.Geometry.LineString([
                        new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
                        new OpenLayers.Geometry.Point(childCenter.lon, childCenter.lat)
                    ]);
                }));
            var lineBkgs = lines.clone();
            this.boundaries.push(new OpenLayers.Feature.Vector(lineBkgs, {},
                { strokeWidth: 3, strokeColor: '#ffffff' }));
            this.boundaries.push(new OpenLayers.Feature.Vector(lines));

            return this.boundaries;
        }
    });

    var csrfToken = $('meta[name="csrf-token"]').attr('content');

    // Setup the basic feature protocol that will be used
    // for retrieving vector feature data.
    blist.openLayers.AuthenticatingFeatureProtocol = OpenLayers.Class(OpenLayers.Protocol.WFS.v1_1_0,
    {
        read: function(options)
        {
            options = OpenLayers.Util.extend({}, options);
            options.headers = OpenLayers.Util.extend({
                'X-App-Token': blist.configuration.appToken,
                'X-CSRF-Token': csrfToken
            }, options.headers);

            return OpenLayers.Protocol.WFS.v1_1_0.prototype.read.call(this, options);
        }
    });

    // This should be a contrib back into OpenLayers source.
    // The correct way to manipulate Layer/Vector.js stuff is its root container.
    OpenLayers.Layer.Vector.prototype.setOpacity = function(opacity)
    {
        if (opacity != this.opacity) {
            this.opacity = opacity;
            this.renderer.root.style.opacity = opacity;
            if (this.map != null) {
                this.map.events.triggerEvent("changelayer", {
                    layer: this,
                    property: "opacity"
                });
            }
        }
    };

    // I've left this untested because it does not seem necessary due to restrictedExtent.
    // It may become necessary when we turn that off.
    OpenLayers.Feature.Vector.prototype.datelineCopy = function()
    {
        if (this._datelineCopy)
        { this._datelineCopy.destroy(); }

        var left = this.layer.getExtent().left;
        var difference = (Math.abs(left)/left) * this.layer.maxExtent.getWidth();

        this._datelineCopy = this.clone();
        this._datelineCopy.geometry.x = this._datelineCopy.geometry.x + difference;
        this._datelineCopy.attributes.datelineHack = true;

        this.layer.addFeatures([this._datelineCopy]);
    };

    OpenLayers.Geometry.Point.prototype.toLonLat = function()
    {
        return new OpenLayers.LonLat(this.x, this.y);
    };

    OpenLayers.LonLat.prototype.toGeometry = function()
    {
        return new OpenLayers.Geometry.Point(this.lon, this.lat);
    };

    OpenLayers.LonLat.prototype.isIncomplete = function()
    {
        return _.any([this.lon, this.lat], _.isNull) || _.any([this.lon, this.lat], _.isNaN);
    };

    OpenLayers.Bounds.prototype.intersection = function(bounds)
    {
        return OpenLayers.Bounds.fromArray([
            Math.max(this.left, bounds.left), Math.max(this.bottom, bounds.bottom),
            Math.min(this.right, bounds.right), Math.min(this.top, bounds.top)]);
    };

    OpenLayers.Bounds.prototype.isDifferentThan = function(bounds, map)
    {
        if (this.equals(bounds)) { return false; }
        if (this.getCenterLonLat().equals(bounds.getCenterLonLat())
            && map.getZoomForExtent(this) == map.getZoomForExtent(bounds))
        { return false; }

        return true;
    };

    OpenLayers.Bounds.prototype.toViewport = function()
    {
        var vp = this.toArray();
        return _.reduce(['xmin', 'ymin', 'xmax', 'ymax'],
            function(memo, property, index)
            { memo[property] = vp[index]; return memo; }, {});
    },

    OpenLayers.Bounds.fromViewport = function(vp)
    {
        return OpenLayers.Bounds.fromArray([vp.xmin, vp.ymax, vp.xmax, vp.ymin]);
    };

    OpenLayers.Bounds.fromClusterBox = function(box)
    {
        return OpenLayers.Bounds.fromArray([box.lon1, box.lat2, box.lon2, box.lat1]);
    };

    OpenLayers.Layer.Heatmap.prototype.removeAllFeatures = function()
    {
        this.setDataSet({ max: 50, data: [] });
    };

    blist.openLayers.Polygon = OpenLayers.Class(OpenLayers.Geometry.Polygon, {
        initialize: function()
        {
            OpenLayers.Geometry.Polygon.prototype.initialize.apply(this, arguments);
            this.attributes = { rows: {}, quantities: {} };
            var primaryComponent = this.components[0];
            this.islands = []; this.holes = [];

            var polygon = this;
            _.each(this.components, function(component)
            {
                if (component == primaryComponent || !primaryComponent.intersects(component))
                { polygon.islands.push(component); }
                else
                { polygon.holes.push(component); }
            });

            _.defer(function() { polygon.getBounds(); }); // Precache if it's faster.
        },

        containsPoint: function(point) {
            if (!this.getBounds().contains(point.x, point.y)) { return false; }

            var numIslands = this.islands.length;
            var numHoles = this.holes.length;
            var contained = false;
            if(numIslands > 0) {
                // check exterior ring - 1 means on edge, boolean otherwise
                for(var i=0; i<numIslands; ++i) {
                    contained = this.islands[i].containsPoint(point);
                    if (contained) break;
                }
                if(contained !== 1) {
                    if(contained && numHoles > 1) {
                        // check interior rings
                        var hole;
                        for(var i=1; i<numHoles; ++i) {
                            hole = this.holes[i].containsPoint(point);
                            if(hole) {
                                if(hole === 1) {
                                    // on edge
                                    contained = 1;
                                } else {
                                    // in hole
                                    contained = false;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            return contained;
        }
    });

    // I'm super uncomfortable with the way I'm referencing the mapObj here.
    blist.openLayers.Viewport = OpenLayers.Class(OpenLayers.Control, {

        EVENT_TYPES: ['viewportchanged'],

        initialize: function(mapObj, viewport)
        {
            this.EVENT_TYPES = blist.openLayers.Viewport.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);

            var control = this;
            control.mapObj = mapObj;
            control.mapObj._controls.MapTypeSwitcher.events.register('maptypechange', null,
                function() { control.expecting = true; });

            control.expecting = false;
            if (_.isObject(viewport))
            { control.original = OpenLayers.Bounds.fromViewport(viewport); }
            else if (_.isArray(viewport))
            { control.original = OpenLayers.Bounds.fromArray(viewport); }
        },

        setMap: function()
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);
            this.map.events.register('moveend', this, this.onMoveEnd);

            // Projecting the entire sphere onto Web Mercator doesn't work correctly.
            var wholeWorld = [-179.999999, -85.051128, 179.999999, 85.051128];
            this.wholeWorld = OpenLayers.Bounds.fromArray(wholeWorld);

            this.viewport = this.viewport
                ? this.viewport.intersection(this.wholeWorld)
                : this.wholeWorld.clone();

            if (this.original)
            { this.original = this.original.intersection(this.wholeWorld); }

            var mapProjection = this.map.getProjectionObject();
            if (this.original)
            { this.original.transform(blist.openLayers.geographicProjection, mapProjection); }
            this.viewport.transform(blist.openLayers.geographicProjection, mapProjection);
            this.wholeWorld.transform(blist.openLayers.geographicProjection, mapProjection);

            this.mapSize = this.map.getSize().clone();

            this._untouched = true;
        },

        destroy: function()
        {
            this.map.events.unregister('moveend', this, this.onMoveEnd);
        },

        onMoveEnd: function()
        {
            if ((blist.debug || {}).viewport && (console || {}).trace)
            {
                console.groupCollapsed('onMoveEnd');
                console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                console.groupCollapsed('state');
                    console.log('handlingEvent:', this.handlingEvent); 
                    console.dir(this.viewport); console.groupEnd();
                console.groupEnd();
            }

            var resizeEvent = !this.mapSize.equals(this.map.getSize());

            if (this.expected() || this.handlingEvent == 'moveend' || resizeEvent) { return; }
            this.events.triggerEvent('viewportchanged');
            this.handlingEvent = 'moveend';

            this.saveViewport();
            this.mapObj._primaryView.update({ displayFormat: $.extend(true, {},
                this.mapObj._displayFormat,
                { viewport: this.toViewport(blist.openLayers.geographicProjection) }) });
            delete this.mapObj._isResize;
            delete this.handlingEvent;
            delete this._untouched;
        },

        saveViewport: function(original)
        {
            this.viewport = (this.map.getExtent() || this.wholeWorld).intersection(this.wholeWorld);
            if (!this.original && original) { this.original = this.viewport.clone(); }
        },

        resetToOriginal: function()
        {
            if (this.willMove(this.original))
            {
                this.expect();
                this.map.zoomToExtent(this.original, true);
                this.saveViewport();
            }
        },

        preferredViewport: function()
        {
            return _.reduce(this.mapObj._children, function(viewport, childView)
            {
                if (childView.loading) { return viewport; }
                if (viewport)
                { viewport.extend(childView.preferredExtent()); return viewport; }
                else
                { return childView.preferredExtent(); }
            }, null);
        },

        zoomToPreferred: function()
        {
            if (this.viewportInOriginal) { return; }
            if (_.any(_.pluck(this.mapObj._children, 'loading'))) { this.delayZoom(); return; }
            var viewport = this.preferredViewport();
            if (!viewport) { return; }
            if (!this.willMove(viewport)) { return; }

            this.expecting = true;
            this.map.zoomToExtent(viewport);
            this.saveViewport();
        },

        delayZoom: function()
        {
            var control = this;
            setTimeout(function() { control.zoomToPreferred(); }, 100);
        },

        expect: function(persist)
        {
            this.expecting = true;
            if (persist) this.expectingMultiple = true;
        },

        expected: function()
        {
            if (this.expecting)
            {
                if (!this.expectingMultiple)
                { this.expecting = false; }
                return true;
            }
            return false;
        },

        stopExpecting: function()
        {
            this.expecting = false;
            delete this.expectingMultiple;
        },

        willMove: function(viewport)
        {
            if (!this.viewport) { return true; }
            return this.viewport.isDifferentThan(viewport, this.map);
        },

        crossesDateline: function()
        {
            return this.viewport.left > this.viewport.right;
        },

        untouched: function()
        {
            return this._untouched;
        },

        isWholeWorld: function()
        {
            if (!this.zoomForWholeWorld)
            { this.zoomForWholeWorld = this.map.getZoomForExtent(this.wholeWorld); }
            return this.map.getZoom() <= this.zoomForWholeWorld;
        },

        project: function(projection)
        {
            if (!projection || projection == this.map.getProjectionObject())
            { return this.viewport; }
            else
            { return this.viewport.clone().transform(this.map.getProjectionObject(), projection); }
        },

        toViewport: function(projection)
        {
            var vp = this.project(projection).toArray();
            return _.reduce(['xmin', 'ymin', 'xmax', 'ymax'],
                function(memo, property, index)
                { memo[property] = vp[index]; return memo; }, {});
        },

        toArray: function(projection)
        {
            return this.project(projection).toArray();
        },

        toExtent: function(projection)
        {
            return this.project(projection);
        },

        toQuery: function(projection, filterColumnId)
        {
            var buildFilterCondition = function(viewport)
            {
                return { type: 'operator', value: 'AND',
                    children: _.flatten(_.map(['x', 'y'], function(axis)
                    {
                        return _.map(['min', 'max'], function(bound)
                        {
                            var condition = { type: 'operator' };
                            condition.value = (bound == 'min')
                                                    ? 'GREATER_THAN'
                                                    : 'LESS_THAN';
                            condition.children = [
                                {
                                    type: 'column',
                                    value: (axis == 'x') ? 'LONGITUDE'
                                                         : 'LATITUDE',
                                    columnId: filterColumnId
                                },
                                {
                                    type: 'literal',
                                    value: Math[bound].apply(null,
                                        [viewport[axis+'min'],
                                         viewport[axis+'max']])
                                }
                            ];
                            return condition;
                        });
                    }))
                };
            };

            var filterCondition = {temporary: true, displayTypes: ['map']};
            var viewport = this.toViewport(projection);
            if (viewport.xmin < viewport.xmax)
            {
                filterCondition = $.extend(filterCondition,
                    buildFilterCondition(viewport));
            }
            else
            {
                var rightHemi, leftHemi;
                rightHemi = $.extend({}, viewport, { xmin: -180 });
                leftHemi  = $.extend({}, viewport, { xmax:  180 });
                filterCondition = $.extend(filterCondition,
                    { type: 'operator', value: 'OR',
                    children: _.map([leftHemi, rightHemi], function(hemi)
                        { return buildFilterCondition(hemi); }) });
            }

            return filterCondition;
        },

        CLASS_NAME: 'blist.openLayers.Viewport'
    });

    blist.openLayers.StaledCluster = OpenLayers.Class(OpenLayers.Control, {

        viewportPercentage: 0.1,

        debug: function() // Handy little grid thing to tell you how much you have to pan.
        {
            var $foo = $("<div />").css({ position: 'absolute', top: 0, left: 0,
                                          border: 'solid 1px black',
                                          width: this.map.getSize().w * this.viewportPercentage,
                                          height: '100%' });
            $('body').append($foo);
        },

        setMap: function()
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);
            this.update();
        },

        isStale: function()
        {
            return this.distance() >= this._distance || this.map.getZoom() != this._zoom;
        },

        distance: function()
        {
            var curPos = this.map.getCenter().toGeometry();
            return curPos.distanceTo(this._cachedPos);
        },

        update: function()
        {
            this._zoom = this.map.getZoom();
            this._cachedPos = this.map.getCenter().toGeometry();
            var size = this.map.getSize();
            this._distance
                = this.map.getResolution() * Math.max(size.w, size.h) * this.viewportPercentage;
        },

        CLASS_NAME: 'blist.openLayers.StaledCluster'
    });

    // STAMEN

    blist.openLayers.Stamen = OpenLayers.Class(OpenLayers.Layer.OSM, {
        initialize: function(name, options) {
            var hosts = _.map(["", "a.", "b.", "c.", "d."], function(subdomain)
            { return "http://" + subdomain + "tile.stamen.com/"
                + ((options || {}).stamenType || 'watercolor') + "/${z}/${x}/${y}.jpg"; });
            options = OpenLayers.Util.extend({
                "numZoomLevels":    16,
                "buffer":           0,
                "transitionEffect": "resize"
            }, options);
            return OpenLayers.Layer.OSM.prototype.initialize.call(this, name, hosts, options);
        }
    });

    blist.openLayers.StamenControl = OpenLayers.Class(OpenLayers.Control, {

        initialize: function()
        {
            this._layers = {};
            this.autoActivate = true;
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
        },

        draw: function()
        {
            this.handler = new OpenLayers.Handler.Keyboard( this, {
                'keyup': this.toggleOff,
                'keydown': this.watercolor });
        },

        toggleOff: function()
        {
            if (this._activated)
            {
                this.map.setBaseLayer(this._baseLayer);
                this._activated = false;
            }
        },

        watercolor: function(evt)
        {
            if (!this._activated && evt.keyCode && evt.keyCode == 87) // 'w'
            {
                this._activated = true;
                if (!this._layer)
                { this.map.addLayer(this._layer = new blist.openLayers.Stamen()); }
                this._baseLayer = this.map.baseLayer;
                this.map.setBaseLayer(this._layer);
            }
        },

        CLASS_NAME: 'blist.openLayers.StamenControl'
    });
})(jQuery);
