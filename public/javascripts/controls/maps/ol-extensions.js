(function($)
{
    blist.namespace.fetch('blist.openLayers');

    Proj4js.defs["EPSG:102100"] = "+proj=merc +lon_0=0 +x_0=0 +y_0=0 +a=6378137 +b=6378137  +units=m +nadgrids=@null";
    Proj4js.defs["EPSG:102698"] = "+proj=tmerc +lat_0=36.16666666666666 +lon_0=-94.5 +k=0.9999411764705882 +x_0=850000 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs"; // For KCMO.

    blist.openLayers.geographicProjection = new OpenLayers.Projection('EPSG:4326');
    blist.openLayers.backgroundLayerTypes = [
        OpenLayers.Layer.Bing, OpenLayers.Layer.ArcGISCache, OpenLayers.Layer.Google,
        OpenLayers.Layer.OSM
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
                                       _.map([$.t('controls.map.auto'),
                                                '1mi', '2mi', '5mi', '10mi', '20mi', '50mi'],
                                           function(text)
                                           { return { tagName: 'option', contents: text }; })
                                   },
                                   { tagName: 'a', 'class': 'button', contents: 'Go'},
                                   { tagName: 'a', 'class': 'my_location',
                                        title: $.t('controls.map.current_location') },
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
                        .example($.t('controls.map.address_prompt'))
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
                    request.bounds = new google.maps.LatLngBounds(
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
                            control.errorMessage($.t('controls.map.geocoding_inaccessible'));
                            break;
                        case google.maps.GeocoderStatus.ZERO_RESULTS:
                            control.errorMessage($.t('controls.map.geocoding_noresults'));
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

            var altText = ['Zoom In', 'Zoom Bar Slider', 'Zoom Out'];
            $('img', this.div).each(function() { $(this)[0].alt = altText.shift(); });

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
                options.controls.push(new OpenLayers.Control.Navigation(
                        { zoomWheelEnabled: !options.interactToScroll }));
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
            if (!extent) { return; }
            extent = extent.clone().intersection(OpenLayers.Bounds.fromArray(
                [-179.999999, -85.051128, 179.999999, 85.051128]).transform(
                blist.openLayers.geographicProjection, this.getProjectionObject()));
            this.restrictedExtent = extent;
            this._extentRestricted = true;
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

        EVENT_TYPES: ['datalayer_hover_over', 'datalayer_hover_out'],

        initialize: function()
        {
            this.EVENT_TYPES = blist.openLayers.Overview.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);
            this._dataLayers = [];
            this._config = { describeCF: true, customEntries: [] };
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

        configure: function(property, value)
        {
            this._config[property] = value;
            this.redraw();
        },

        // FIXME: #draw and #redraw as used here are non-idiomatic.
        draw: function()
        {
            var $dom = $(this.map.div);
            if ($dom.siblings('.mapLayers').length < 1)
            {
                $dom.before(this.$dom = $.tag2({ _: 'div', contents: [
                    { _: 'div', className: 'contentBlock', contents: [
                        { _: 'h3', className: 'data', contents: $.t('controls.map.data_layers') },
                        { _: 'ul', className: 'data' },
                        { _: 'ul', className: 'feature' },
                        { _: 'h3', className: 'base', contents: $.t('controls.map.base_layers') },
                        { _: 'ul', className: 'base' },
                        { _: 'div', className: 'customEntries' }
                    ]},
                    { _: 'h3', className: ['minimized', 'hide'], contents: [
                        $.t('controls.map.map_legend'),
                        { _: 'span', contents: ' (show)' }]},
                    { _: 'div', className: 'close_button' }
                ], className: ['mapOverview', 'topRight'] }));

                var control = this;
                this.$dom.find('.minimized, .close_button').click(function() { control.toggle(); });
            }
        },

        reposition: function(where)
        {
            this.$dom.toggleClass('hide', where == 'none');

            _.each(['topRight', 'bottomLeft'], function(cn)
            { this.$dom.toggleClass(cn, cn == where); }, this);
        },

        // Consider being more incisive? Parameter: `evt.layer`.
        redraw: function(evtObj)
        {
            var control = this;
            if (control._handlingEvent == 'changebaselayer') { return; }

            var $dom = this.$dom;
            var backgroundLayers = this.exclusiveLayers ? _.values(this.mtSwitcher.layers)
                                                        : this.map.backgroundLayers();
            if (control.map.hasNoBackground) { backgroundLayers = []; }

            $dom.find('ul').empty();
            $dom.find('.customEntries').empty();

            $dom.find('.base').toggle(backgroundLayers.length > 0);
            $dom.find('.data').toggle(this._dataLayers.length > 0);

            _.each(backgroundLayers.slice().reverse(), this.renderBackgroundLayer, this);
            _.each(this._dataLayers.slice().reverse(), this.renderDataLayer, this);
            _.each(this._config.customEntries, this.renderCustomEntry, this);

            $dom.find(':checkbox').click(function(e)
            {
                var $check = $(e.currentTarget);
                var layer = $check.parents('li').data('layer')
                layer.setVisibility($check.value());

                if (layer.visibility)
                { delete layer.hiddenByUser; }
                else
                { layer.hiddenByUser = true; }
            }).uniform();

            $dom.find(':radio').click(function(e)
            {
                var $check = $(e.currentTarget);
                var layer = $check.parents('li').data('layer');
                if (control.map.getLayerIndex(layer) == -1)
                { control.map.addLayers([layer]); }
                control.map.setBaseLayer(layer);
            });

            $dom.find('ul.data li, ul.feature li').hover(
                   function() { control.events.triggerEvent('datalayer_hover_over',
                    { layer: $(this).data('layer') });
                }, function() { control.events.triggerEvent('datalayer_hover_out',
                    { layer: $(this).data('layer') });
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

            if (!this.exclusiveLayers && $('ul.base:visible').length > 0)
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

        renderBackgroundLayer: function(layer)
        {
            var lId = 'mapLayer_' + (layer.name || '').replace(' ', '_'),
                layerName = $.isBlank(layer.alias) ? layer.name : layer.alias;
            var $layerSet = this.$dom.find('ul.base'), $layer;
            var checked = this.exclusiveLayers ? this.map.baseLayer == layer
                                               : layer.visibility;

            var buttonType = this.exclusiveLayers ? { 'type': 'radio', 'name': 'backgroundLayers' }
                                                  : { 'type': 'checkbox' };
            checked && $.extend(buttonType, { checked: 'checked' });

            $layerSet.append($layer = $.tag2({ _: 'li', 'data-layerid': layer.id, contents: [
                $.extend({ _: 'input', id: lId }, buttonType),
                { _: 'label', 'for': lId, contents: layerName }
            ] }) );

            $layer.find(':radio').uniform();
            $layer.data('layer', layer);
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

        renderDataLayer: function(layerObj)
        {
            var control = this, $dom = this.$dom;
            var dataLayers = _($.makeArray(layerObj.dataLayers())).chain()
                .flatten().compact().value();

            var typeMap = {
                'point':     $.t('controls.map.point_map'),
                'heatmap':   $.t('controls.map.boundary_map'),
                'rastermap': $.t('controls.map.heat_map')
            };

            _.each(dataLayers, function(layer)
            {
                var $layerSet = layer instanceof OpenLayers.Layer.Vector ? $dom.find('ul.feature')
                                                                         : $dom.find('ul.data');
                var lId = 'mapLayer_' + layer.name;
                var layerName = layerObj._displayFormat.alias || layer.name;
                var layerType = typeMap[layerObj._displayFormat.plotStyle]
                if (layerType) { layerType = ' title="' + layerType + '"'; }
                if (dataLayers.length > 1)
                { layerName += ' (of ' + layerObj._view.name + ')'; }
                $layerSet.append('<li data-layerid="' + layer.id + '"' +
                    '><input type="checkbox" id="' + lId + '"' +
                    (layer.visibility ? ' checked="checked"' : '') +
                    ' /><label for="' + lId + '"' + layerType + '>' + layerName + '</label>' +
                    '</li>');
                var $layerLI = $layerSet.find('li:last');
                $layerLI.data('layer', layer);

                control.renderLegend(layerObj);
            });
        },

        renderCustomEntry: function(entry)
        {
            var $row;
            this.$dom.find('.customEntries').append($row = $.tag2({ _: 'div', contents: [
                    { _: 'div', className: 'symbol' },
                    { _: 'div', className: 'description', contents: entry.label }
                ], 'className': 'legendRow clearfix oneColor'
            }));

            this.renderLegendRow.oneColor(entry, $row);
        },

        /*
          Rules:
            1) If you don't have a description, you don't get included in the legend.
            2) Icons will be shrunk to a 16x16 with appropriate aspect ratio.
        */
        renderLegend: function(layerObj)
        {
            var legendData = layerObj.legendData();
            if (_.isEmpty(legendData)) { return; }

            var $container = this.$dom.find('ul.feature li:last'), $row;

            _.each(legendData, function(datum)
            {
                if (!this._config.describeCF && datum.cf) { return; }

                $container.append($row = $.tag2({ _: 'div', contents: [
                        { _: 'div', className: 'symbol' },
                        { _: 'div', className: 'description', contents: datum.description }
                    ], 'className': 'legendRow clearfix ' + datum.symbolType
                }));

                this.renderLegendRow[datum.symbolType](datum, $row);
            }, this);
        },

        renderLegendRow:
        {
        oneColor: function(datum, $row)
        {
            $row.find('.symbol').append($.tag2({ _: 'div', className: 'color_swatch', contents: [
                { _: 'div', className: 'inner', contents: '&nbsp;' }]
            }));
            $row.find('.color_swatch').css('background-color', datum.color);
        },
        icon: function(datum, $row)
        {
            $row.find('.symbol').append($.tag2({ _: 'img', src: datum.icon }));
        },
        colorRange: function(datum, $row)
        {
            var humanify = $.humanify.curry(2, 4),
                min = humanify(datum.minimum),
                max = humanify(datum.maximum);

            $row.find('.symbol').append($.tag2({ _: 'ul', contents: _.map(datum.gradient,
                function(segment, index)
                {
                    var valueRange = _.map(
                            [index == 0 ? datum.minimum
                                        : datum.gradient[index-1].value,
                             ' - ', segment.value], $.commaify)
                        .join('');

                    return { _: 'div', className: 'color_swatch',
                        style: 'background-color: ' + segment.color, title: valueRange,
                        contents: [{ _: 'div', className: 'inner', contents: '&nbsp;' }]
                    };
                })
            }));
            $row.append($.tag2({ _: 'div', className: 'rangeValues', contents: [
                { _: 'span', contents: min },
                { _: 'span', style: { 'text-align': 'right', 'float': 'right'}, contents: max }
            ]}));
        }
        },

        resetBackground: function()
        {
            if (!this.exclusiveLayers) { return; }
            this.$dom.find('ul.base li:first input:radio').attr('checked', 'checked');
            this.map.setBaseLayer(this.map.backgroundLayers()[0])
        },

        // The purpose of this is to make sure the height of the overview does not
        // cover the attribution or overflow out of the map window.
        correctHeight: function()
        {
            var $div = $(this.map.div);
            var $layers = this.$dom;
            // Don't run this when minimized.
            if ($layers.find('.contentBlock').hasClass('hide')) { return; }

            var $bottom = $(this.map.getControlsByClass('OpenLayers.Control.Attribution')[0].div);
            var height = ($bottom.filter(':visible').length == 0)
                ? $div.height() - 20 : $bottom.position().top - 10;
            height -= $layers.position().top + $layers.padding().top + $layers.padding().bottom;
            $layers.css('max-height', height);
            $layers.find('.contentBlock').css({
                'max-height': height-(2 * $layers.find('.toggleLayers').height()),
                'overflow': 'auto'});
        },

        // Hiding should result in .minimized visible only.
        toggle: function()
        {
            this.$dom.find('.contentBlock, .minimized, .close_button').toggleClass('hide');
        },

        CLASS_NAME: 'blist.openLayers.Overview'
    });

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

    OpenLayers.Bounds.prototype.isValid = function()
    {
        return !(  _.any([this.left, this.bottom, this.right, this.top], _.isNull)
                || _.any([this.left, this.bottom, this.right, this.top], _.isNaN));
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

    // If the map will not zoom and will not move more than a pixel, it is not MUCH different.
    // map.resolution is (map units)/pixel, so if the distance is smaller, it is less than a pixel.
    OpenLayers.Bounds.prototype.isMuchDifferentThan = function(bounds, map)
    {
        if (this.equals(bounds)) { return false; }
        if (this.getCenterLonLat().toGeometry()
                .distanceTo(bounds.getCenterLonLat().toGeometry()) < map.resolution
            && map.getZoomForExtent(this) == map.getZoomForExtent(bounds))
        { return false; }

        return true;
    };

    OpenLayers.Bounds.prototype.isPoint = function()
    {
        return this.left == this.right && this.top == this.bottom;
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
        if (vp.sr)
        { return OpenLayers.Bounds.fromArray([vp.xmin, vp.ymax, vp.xmax, vp.ymin])
            .transform(new OpenLayers.Projection('EPSG:' + vp.sr),
                       blist.openLayers.geographicProjection); }
        else
        { return OpenLayers.Bounds.fromArray([vp.xmin, vp.ymax, vp.xmax, vp.ymin]); }
    };

    OpenLayers.Bounds.fromClusterBox = function(box)
    {
        return OpenLayers.Bounds.fromArray([box.lon1, box.lat2, box.lon2, box.lat1]);
    };

    OpenLayers.Layer.Heatmap.prototype.removeAllFeatures = function()
    {
        this.setDataSet({ max: 50, data: [] });
    };

    OpenLayers.Events.prototype.once = function(type, obj, func)
    {
        var _this = this,
            callback = function() { _this.unregister(type, obj, callback); func(); };
        this.register(type, obj, callback);
    };

    // For some reason, OpenLayers normally converts the pixel to lonlat which
    // breaks horribly when your baseLayer is hidden.
    // Related bugs: 9820, 10919.
    OpenLayers.Popup.FramedCloud.prototype.calculateRelativePosition = function(px)
    {
        var size = this.map.getSize(),
            quadrant = "";
            center = { x: size.w / 2, y: size.h / 2 };

        quadrant += (px.y < center.y) ? "t" : "b";
        quadrant += (px.x < center.x) ? "l" : "r";

        return OpenLayers.Bounds.oppositeQuadrant(quadrant);
    };

    blist.openLayers.Polygon = OpenLayers.Class(OpenLayers.Geometry.Polygon, {
        initialize: function()
        {
            OpenLayers.Geometry.Polygon.prototype.initialize.apply(this, arguments);
            this.attributes = { rows: {}, quantities: {} };
        },

        componentsReady: function()
        {
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

        containsPoint: function(point)
        {
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

        EVENT_TYPES: ['viewportchanged', 'resize'],

        initialize: function(mapObj, viewport)
        {
            this.EVENT_TYPES = blist.openLayers.Viewport.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);

            var control = this;
            control.mapObj = mapObj;
            control.mapObj._controls.MapTypeSwitcher.events.register('maptypechange', null,
                function() { control.expect('MapTypeSwitcher#maptypechange'); });

            control.expecting = false;
            control.expectReasons = [];
            if (_.isObject(viewport) && viewport.xmin)
            { control.original = OpenLayers.Bounds.fromViewport(viewport); }
            else if (_.isArray(viewport))
            { control.original = OpenLayers.Bounds.fromArray(viewport); }

            if (control.original && !control.original.isValid())
            { delete control.original; }

            control.viewportInOriginal = !!control.original;
        },

        setMap: function()
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);
            if (!this.map.baseLayer)
            {
                // Call me again when you have a baseLayer.
                this.map.events.once('changebaselayer', this, this.setMap);
                return;
            }
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
                    console.log('resizeEvent', !this.mapSize.equals(this.map.getSize()));
                    console.log('untouched', this._untouched);
                    console.log('expecting', this.expecting, this.expectReasons);
                    console.dir(this.viewport); console.groupEnd();
                console.groupEnd();
            }

            var resizeEvent = !this.mapSize.equals(this.map.getSize());
            if (resizeEvent)
            {
                this.mapSize = this.map.getSize().clone();
                this.events.triggerEvent('resize');
            }

            if (this.expected() || this.handlingEvent == 'moveend' || resizeEvent) { return; }
            this.events.triggerEvent('viewportchanged');
            this.handlingEvent = 'moveend';

            this.saveViewport();
            var newDF = $.extend(true, {},
                this.mapObj._displayFormat,
                { viewport: this.toViewport(blist.openLayers.geographicProjection, 0.9) });
            if (this.mapObj._primaryView)
            { this.mapObj._primaryView.update({ displayFormat: newDF }); }
            else
            { this.mapObj.updateDisplayFormat(newDF); }

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
                this.expect('Viewport#resetToOriginal');
                this.map.zoomToExtent(this.original);
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

            this.expect('Viewport#zoomToPreferred');
            this.map.zoomToExtent(viewport);
            this.saveViewport();
        },

        delayZoom: function()
        {
            var control = this;
            setTimeout(function() { control.zoomToPreferred(); }, 100);
        },

        expect: function(reason, persist)
        {
            this.expecting = true;
            this.expectReasons.push(reason);
            if (persist) this.expectingMultiple = true;
        },

        expected: function()
        {
            if (this.expecting)
            {
                if (!this.expectingMultiple)
                {
                    this.expecting = false;
                    this.expectReasons = [];
                }
                return true;
            }
            return false;
        },

        stopExpecting: function()
        {
            this.expecting = false;
            this.expectReasons = [];
            delete this.expectingMultiple;
        },

        willMove: function(viewport)
        {
            if (!this.viewport) { return true; }
            return this.viewport.isMuchDifferentThan(viewport, this.map);
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

        toViewport: function(projection, scale)
        {
            var vp = this.project(projection).scale(scale || 1).toArray();
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

        toQuery: function(projection, filterColumnFieldName)
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
                                    columnFieldName: filterColumnFieldName
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

            // include table displayType because the ds is likely a source table.
            var filterCondition = {temporary: true, displayTypes: ['map', 'table']};
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

    blist.openLayers.Flyout = OpenLayers.Class(OpenLayers.Control, {

       EVENT_TYPES: ['close'],

        initialize: function(mapObj)
        {
            this.EVENT_TYPES = blist.openLayers.Flyout.prototype.EVENT_TYPES.concat(
                               OpenLayers.Control.prototype.EVENT_TYPES);
            OpenLayers.Control.prototype.initialize.apply(this, arguments);

            if (mapObj._displayFormat.disableFlyouts)
            { this.disabled = true; }

            this.mapObj = mapObj;
        },

        setMap: function()
        {
            OpenLayers.Control.prototype.setMap.apply(this, arguments);
            this.map.events.register('click', this, this.close);
        },

        destroy: function()
        {
            OpenLayers.Control.prototype.destroy.apply(this, arguments);
            this.map.events.unregister('click', this, this.close);
        },

        sayLoading: function(lonlat)
        {
            if (this._popup) { return; }

            var control = this;
            control._popup = new OpenLayers.Popup.FramedCloud(null, lonlat, null,
                $.t('controls.map.loading'), null, true,
                function(evt) { new jQuery.Event(evt).stopPropagation(); control.close(); });
            control.map.addPopup(control._popup);
            // TODO: Decide if this is a good thing.
            control._loading = setTimeout(function() { control.close(); }, 500);
        },

        // For actively saying nothing was loaded.
        cancel: function()
        {
            if (_.isEmpty(this._layers)) { this.close(); }
        },

        add: function(layerObj, lonlat, contents, options)
        {
            if ((blist.debug || {}).flyouts && (console || {}).trace)
            {
                console.groupCollapsed('Flyout#add');
                    console.groupCollapsed('arguments'); console.dir(arguments); console.groupEnd();
                    console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                    console.groupCollapsed('before state');
                        console.dir(this._layers);
                    console.groupEnd();
                console.groupEnd();
            }
            if (this._loading) { clearTimeout(this._loading); }
            options = options || {};

            // If we've moved more than 5 pixels, make a new popup.
            // TODO: There has GOT to be a better way to decide to regenerte the popup.
            // Maybe catch a click event and invalidate popup every time we get one?
            var pixel = this.map.getViewPortPxFromLonLat(lonlat);
            if (this._pixel && pixel.distanceTo(this._pixel) > 5) { this.close(); }
            this._pixel = pixel;

            this._layers = $.makeArray(this._layers);
            var layerOpen = _.detect(this._layers, function(l) { return layerObj == l.dataObj; });
            if (layerOpen)
            { layerOpen.contents = contents; }
            else
            { this._layers.push({ dataObj: layerObj, contents: contents }); }
            // TODO: Dynamic generation of rows using "custom" renderer.

            if (!this._popup) { this._open(lonlat, options); }
            else { this._popup.contentDiv.innerHTML = this.buildContents(); }

            // Fix for Support 2836.
            // Hidden base layers are Bad News. Need to figure out a better way around them.
            this._popup.pixel = options.atPixel;
            if (options.atPixel)
            { this._popup.relativePosition
                = this._popup.calculateRelativePosition(options.atPixel); }

            this._popup.updateSize();

            // Hack for Bug 9280.
            if (options.atPixel)
            { this._popup.moveTo(options.atPixel); }
        },

        _open: function(lonlat, options)
        {
            var control = this;
            if (control.disabled) { return; }

            control.close();

            control._popup = new OpenLayers.Popup.FramedCloud(null, lonlat, null,
                control.buildContents(), null, true,
                function(evt) { new jQuery.Event(evt).stopPropagation(); control.close(); });

            // TODO: make this an event?
            control._onClosePopup = $.makeArray(control._onClosePopup);
            control._onClosePopup.push(options.closeBoxCallback);

            control._popup.panMapIfOutOfView = false;
            control.map.addPopup(control._popup);

            control.fixPopup();
        },

        close: function()
        {
            if ((blist.debug || {}).flyouts && (console || {}).trace)
            {
                console.groupCollapsed('Flyout#close');
                    console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                console.groupEnd();
            }
            if (!this._popup) { return; }
            this.events.triggerEvent('close');
            _.each(this._onClosePopup || [], function(f) { if (_.isFunction(f)) { f(); } });

            this._layers = [];
            this._onClosePopup = [];
            if (this._popup) // Seriously, I don't understand.
            { this._popup.destroy(); }
            this._popup = null;
        },

        fixPopup: function()
        {
            var mapObj = this.mapObj,
                popup = this._popup;

            // retarded shit for OL kiddies
            $('.olPopup > div > div:last-child').css('height', '34px');

            $('.olFramedCloudPopupContent')
                .on('click', '.infoPaging a', function(event)
                {
                    event.preventDefault();

                    var $a = $(this);
                    if ($a.hasClass('disabled')) { return; }

                    var $paging = $a.parent();
                    var action = $.hashHref($a.attr('href')).toLowerCase();

                    var $rows = $paging.siblings('.row');
                    var $curRow = $rows.filter(':visible');

                    var newIndex = $curRow.index() + (action == 'next' ? 1 : -1);
                    if (newIndex < 0) { return; }
                    if (newIndex >= $rows.length) { return; }

                    $curRow.addClass('hide');
                    $rows.eq(newIndex).removeClass('hide');

                    $paging.find('a').removeClass('disabled');
                    if (newIndex <= 0)
                    { $paging.find('.previous').addClass('disabled'); }
                    if (newIndex >= $rows.length - 1)
                    { $paging.find('.next').addClass('disabled'); }
                })
                .on('click', '.flyoutRenderer .viewRow', function(e)
                {
                    var $a = $(this);
                    // Open a new page if it's not the same view.
                    if ($a.attr('target') == '_blank') { return; }
                    e.preventDefault();
                    mapObj.closeFlyout($a);
                    var href = $a.attr('href').split('/');
                    $(document).trigger(blist.events.DISPLAY_ROW,
                        [href.slice(href.length - 2).join('/')]);
                })
                .on('click', '.layerPaging a', function(event)
                {
                    event.preventDefault();

                    var $a = $(this);
                    if ($a.hasClass('disabled')) { return; }

                    var newIndex = $.hashHref($a.attr('href')).slice(5);
                    var $paging = $a.parent().parent();

                    var $layers = $paging.siblings('.flyoutLayer');
                    var $curLayer = $layers.filter(':visible');

                    $curLayer.addClass('hide');
                    $layers.eq(newIndex).removeClass('hide');

                    $paging.find('a').removeClass('disabled');
                    $a.addClass('disabled');

                    popup.updateSize();
                });
        },

        buildContents: function(asText)
        {
            var $flyout = $.tag({ tagName: 'div', 'class': 'flyoutWrapper' });

            if (_.size(this._layers) > 1)
            {
                $flyout.append($.tag({ tagName: 'div', 'class': 'flyoutToggle',
                    contents: $.t('controls.map.multiple_layer_instructions') }));
                $flyout.append($.tag({ tagName: 'ul', 'class': 'layerPaging', contents:
                    _.map(this._layers, function(dataLayer, index)
                    { return { tagName: 'li', contents: [{
                        tagName: 'a', 'class': index === 0 ? 'disabled' : '',
                        href: '#Layer' + index, title: dataLayer.dataObj._view.name,
                        contents: '&bull; ' + dataLayer.dataObj._view.name }]}; })
                }));
            }

            _.each(this._layers, function(l, i)
            {
                var $layer = $.tag({ tagName: 'div', 'class': 'flyoutLayer' });
                $layer.append(l.contents);
                $flyout.append($layer);
                if (i > 0) { $layer.addClass('hide'); }
            });

            var wrapper = document.createElement('div');
            wrapper.appendChild($flyout[0]);
            return wrapper.innerHTML;
        },

        CLASS_NAME: 'blist.openLayers.Flyout'
    });

    // STAMEN

    blist.openLayers.Stamen = OpenLayers.Class(OpenLayers.Layer.OSM, {
        initialize: function(name, options) {
            var hosts = _.map(["", "a.", "b.", "c.", "d."], function(subdomain)
            { return "http://" + subdomain + "tile.stamen.com/"
                + ((options || {}).stamenType || 'watercolor') + "/${z}/${x}/${y}.jpg"; });
            options = OpenLayers.Util.extend({
                "availableZoomLevels": 16,
                "numZoomLevels":       16,
                "buffer":              0,
                "transitionEffect":    "resize"
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
