(function($)
{
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    blist.namespace.fetch('blist.openLayers');

    var geographicProjection = blist.openLayers.geographicProjection = new OpenLayers.Projection('EPSG:4326');
    var killAnimation = false;

    var animationOff = true;

    Proj4js.defs["EPSG:102100"] = "+proj=merc +lon_0=0 +x_0=0 +y_0=0 +a=6378137 +b=6378137  +units=m +nadgrids=@null";

    var isNormalMap
        = function(_view) { return !_.isUndefined((_view.displayFormat || {}).plotStyle); };

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
            $(this.map.div).siblings('.mapTypes').show();
        },

        deactivate: function()
        {
            $(this.map.div).siblings('.mapTypes').hide();
        },

        redraw: function(evtObj)
        {
            var _this = this;
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
            if (_.isEmpty(this.layers)) { return; }

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

    $.Control.extend('socrataMap', {
        _getMixins: function(options)
        {
            var mixins = [];
            var df = options.displayFormat || (options.view || {}).displayFormat;

            var mapService = df.type || 'google';
            if (mapService == 'heatmap' || !$.isBlank(options.view) && options.view.isArcGISDataset())
            { mapService = 'esri'; }
            else if (!$.isBlank(options.view) && options.view.isGeoDataset())
            { mapService = 'openlayers'; }
            mixins.push(mapService);

            if (!$.isBlank(options.view) && options.view.isArcGISDataset())
            { mixins.push('arcGISmap'); }

            var plotStyle = df.plotStyle;
            if (df.type == 'heatmap')
            { plotStyle  = 'heatmap'; }
            mixins.push(plotStyle);

            return mixins;
        },

        isValid: function()
        {
            return Dataset.map.isValid(this._primaryView, this._displayFormat);
        },

        initializeVisualization: function ()
        {
            var mapObj = this;

            mapObj._segments = {};
            mapObj._numSegments = 6;

            if (mapObj._primaryView.isGeoDataset())
            {
                mapObj._geo = mapObj._primaryView.metadata.geo;
                mapObj._pubDate = mapObj._primaryView.publicationDate;
            }

            if (mapObj.$dom().siblings('.mapLayers').length < 1)
            {
                mapObj.$dom()
                    .before('<div class="mapLayers" class="commonForm">' +
                    '<a href="#toggleLayers" class="toggleLayers">' +
                    'Layer Options' +
                    '</a>' +
                    '<div class="contentBlock hide">' +
                    '<h3 class="base">Base Layers</h3><ul class="base"></ul>' +
                    '<h3 class="data">Data Layers</h3><ul class="data"></ul>' +
                    '<a class="button addValue add"><span class="icon"></span>' +
                        'Add Dataset Layer</a>' +
                    '</div>' +
                    '</div>');
                mapObj.$dom().siblings('.mapLayers').find('a.toggleLayers')
                    .click(function(e)
                    {
                        e.preventDefault();
                        mapObj.$dom().siblings('.mapLayers')
                            .find('.contentBlock').toggleClass('hide');
                    });

                var $layers = mapObj.$dom().siblings('.mapLayers');

                var isUid = function(str) { return /^[0-9a-z]{4}(-[0-9a-z]{4})?$/.test(str); };

                $layers.find('a.button').click(function() {
                    var $this = $(this);
                    var $input = $('<input type="text">').wrap('<div>');
                    $this.before($input.parent());
                    $input.awesomecomplete({
                        typingDelay: 500,
                        dataMethod: function(value, $item, callback)
                        {
                            if ($item.hasClass('prompt')) { return; }

                            value = $.trim(value);
                            var query = isUid(value) ? value : 'name:' + value;
                            Dataset.search({q: query, limitTo: 'maps', nofederate: true, limit: 20 },
                                function(data) {
                                    callback(_.reject(data.views,
                                        function(view) { return view.viewType == 'geo'; }))
                                });
                        },
                        noResultsMessage: 'No results were found. Note: This search only ' +
                            'matches full words.',
                        renderFunction: function(dataItem, topMatch)
                        { return '<p>' + dataItem.name + '</p>'; },
                        onComplete: function(dataset)
                        {
                            var uid = dataset.id;
                            mapObj._primaryView.update({ displayFormat:
                                $.extend({}, mapObj._displayFormat, { compositeMembers:
                                    (mapObj._displayFormat.compositeMembers || []).concat(uid) })
                            });
                            mapObj._dataViews.push(dataset);
                            mapObj._byView[dataset.id] = { view: dataset };
                            if (mapObj.getColumns())
                            {
                                mapObj._boundViewEvents = false;
                                mapObj.ready();
                            }
                            mapObj.getDataForAllViews();
                            $input.parent().remove();
                        }
                    }).example('Enter dataset name');
                });

            }

            mapObj.initializeFlyouts((mapObj._displayFormat.plot || {}).descriptionColumns);


            mapObj._origData = {
                displayFormat: mapObj._displayFormat,
                mapType: mapObj._displayFormat.type,
                plotStyle: mapObj._displayFormat.plotStyle,
                layers: mapObj._displayFormat.layers};

            mapObj._highlightColor = $.rgbToHex($.colorToObj(
                blist.styles.getReferenceProperty('itemHighlight', 'background-color')));

            mapObj.ready();

            mapObj.initializeMap();
        },

        initializeMap: function()
        {
            var mapObj = this;

            var mapOptions =
            {
                theme: null,
                projection: 'EPSG:900913',
                displayProjection: geographicProjection,
                units: 'm',
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                  20037508.34,  20037508.34),
                restrictedExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                         20037508.34,  20037508.34),
                maxResolution: 156543.0339,
                numZoomLevels: 21
            }

            if (mapObj._displayFormat.viewport)
            {
                mapOptions.extent
                    = OpenLayers.Bounds.fromArray([mapObj._displayFormat.viewport.xmin,
                                                   mapObj._displayFormat.viewport.ymin,
                                                   mapObj._displayFormat.viewport.ymax,
                                                   mapObj._displayFormat.viewport.ymax])
                    .transform(geographicProjection, new OpenLayers.Projection('EPSG:900913'));
            }

            if (mapObj._displayFormat.disableNavigation)
            { mapOptions.disableNavigation = true; }

            OpenLayers.ImgPath = '/images/openlayers/';

            mapObj.map = new blist.openLayers.Map(mapObj.$dom()[0], mapOptions);
            mapObj._mapElementsLoading = mapObj._dataViews.length;

            mapObj.map.events.register('changebaselayer', null, function(evtObj)
            {
                var zoombar = mapObj.map.getControlsByClass('blist.openLayers.ZoomBar')[0];
                if (!zoombar) { return; }

                // Magic number: height that we want the zoombarDiv to be at.
                // Calculated as zoom_gutter.png (277) minus button heights (21) minus padding (2)
                // 277 - (2*21) - (2*2) = 231
                zoombar.zoomStopHeight = 231 / evtObj.layer.numZoomLevels;
                zoombar.redraw();
            });

            mapObj.initializeBaseLayers();
            mapObj.populateLayers();

            if (!mapObj._markers)
            { mapObj._markers = {}; }

            if (!mapObj._displayLayers)
            { mapObj._displayLayers = []; }

            var geocodeDialog = new blist.openLayers.GeocodeDialog();
            mapObj.map.addControl(geocodeDialog);
            geocodeDialog.events.register('geocoding', geocodeDialog,
                function() { mapObj.startLoading(); });
            geocodeDialog.events.register('geocodingdone', geocodeDialog,
                function() { mapObj.finishLoading(); });
            geocodeDialog.events.register('placepoint', geocodeDialog,
                function(evt) {
                    mapObj.enqueueGeometry('point', evt.lonlat,
                        'geocodeMarker', { icon: '/images/pin.png' });
                });

            mapObj.initializeEvents();
        },

        getRequiredJavascripts: function()
        {
            // This is a terrible hack; but we need to know if Google
            // has already been loaded, since it has a special callback.
            // We can't store a normal object var, because the whole
            // library is being recreated
            if (blist.util.googleCallbackMap) { return null; }

            blist.util.googleCallback = this._setupLibraries;
            blist.util.googleCallbackMap = this;
            return "https://maps.google.com/maps/api/js?sensor=true&libraries=geometry&callback=blist.util.googleCallback";
        },

        _setupLibraries: function()
        {
            // Grab a reference to the current object (this) from a global
            var mapObj = blist.util.googleCallbackMap;
            mapObj._librariesLoaded();
        },

        initializeEvents: function()
        {
            var mapObj = this;

            mapObj.map.events.register('moveend', mapObj.map, function()
            {
                if (_.any([mapObj._initialLoad, mapObj._ignoreMoveEnd, mapObj._boundsChanging]))
                {
                    if (mapObj._boundsChanging)
                    { delete mapObj._isResize; }
                    delete mapObj._ignoreMoveEnd;
                    delete mapObj._boundsChanging;
                    return;
                }

                mapObj.updateDatasetViewport(mapObj._isResize);
                mapObj.updateRowsByViewport();

                // For when animations are turned off.
                _.each(mapObj._byView, function(viewConfig)
                { if (!viewConfig._animation && viewConfig._renderType == 'clusters')
                    { viewConfig._displayLayer.removeAllFeatures(); } });
                delete mapObj._isResize;
            });

            mapObj.events = { changedVisibility: function() {} };

            mapObj.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0].events
                .register('maptypechange', null, function() { mapObj._ignoreMoveEnd = true; });
            mapObj.map.getControlsByClass('OpenLayers.Control.Attribution')[0].events
                .register('attributionupdated', null, function() { mapObj.fixMapLayers(); });

            mapObj._hoverTimers = {};

            mapObj.map.events.register('mousemove', mapObj,
                function(evt) { mapObj._lastClickAt = mapObj.map.events.getMousePosition(evt); });
        },

        currentZoom: function()
        {
            if (this.map)
            { return this.map.getZoom(); }
        },

        zoomDistance: function()
        {
            if (_.isUndefined(mapObj._lastZoomLevel))
            { return 0; }
            else
            { return Math.abs(mapObj.currentZoom() - mapObj._lastZoomLevel); }
        },

        getMinDistanceForViewportPixels: function(viewport, pixels)
        {
            // Maximum number of divisions that can be made of the pixelspace available.
            var numDivisions = Math.min(this.$dom().height(),
                                        this.$dom().width()) / pixels;

            // Divide the viewport using the max number of divisions.
            return Math.min(viewport.ymax - viewport.ymin,
                            viewport.xmax - viewport.xmin) / numDivisions;
        },

        columnsLoaded: function()
        {
            var mapObj = this;
            if (mapObj._byView[mapObj._primaryView.id]._colorValueCol)
            {
                if (!mapObj._gradient)
                {
                    mapObj._gradient = $.gradient(mapObj._numSegments,
                            mapObj._displayFormat.color || "#0000ff");
                }

                mapObj.$legend({
                    name: mapObj._byView[mapObj._primaryView.id]
                        ._colorValueCol.name,
                    gradient: _.map(mapObj._gradient,
                          function(c) { return "#"+$.rgbToHex(c); }
                )});
            }
            else
            { mapObj._legend && mapObj._legend.$dom.hide(); }
        },

        mapElementLoaded: function()
        {
            this._mapElementsLoading--;
            if (!this._mapLoaded && this._mapElementsLoading <= 0)
            {
                this.mapLoaded();
                this._mapLoaded = true;
            }
        },

        mapLoaded: function()
        {
            // This is called once a map has been loaded, as type-appropriate
            if (this._primaryView.snapshotting)
            { setTimeout(this._primaryView.takeSnapshot, 2000); }
        },

        reset: function()
        {
            var mapObj = this;
            mapObj.clearGeometries();
            mapObj._markers = {};
            $(mapObj.currentDom).removeData('socrataMap');
            mapObj.map.destroy();
            delete mapObj.map;
            mapObj.$dom().empty();
            mapObj._obsolete = true;
            if (mapObj._legend) { mapObj._legend.$dom.hide(); }
            // We need to change the ID so that maps (such as ESRI) recognize
            // something has changed, and reload properly
            mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
            var repostDF = !$.isBlank(mapObj._savedDF || mapObj.settings.displayFormat) ?
                mapObj._displayFormat : null;
            $(mapObj.currentDom).socrataMap($.extend({}, mapObj.settings, {view: mapObj._primaryView,
                displayFormat: repostDF}));
        },

        // Read: Mixins changed. TODO: Rewrite how mixins work.
        needsFullReset: function()
        {
            var od = this._origData || {};
            return this._displayFormat.type != od.mapType ||
                this._displayFormat.plotStyle != od.plotStyle;
        },

        clearGeometries: function()
        {
            _.each(this._displayLayers, function(displayLayer)
            { displayLayer.removeAllFeatures(); });
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            if (mapObj._requireRowReload && !mapObj._byView[mapObj._primaryView.id]._viewportChanged)
            { delete mapObj._neverCluster; }

            mapObj._super();

            mapObj.closePopup();

            _.each(mapObj._byView, function(viewConfig)
            {
                viewConfig._llKeys = {};
                _.each(['_locCol', '_geoCol', '_latCol', '_longCol', '_iconCol', '_quantityCol',
                        '_sizeValueCol', '_colorValueCol', '_redirectCol'], function(prop)
                { delete viewConfig[prop]; });
            });

            if (mapObj._baseLayers)
            { _.each(mapObj._baseLayers, function(layer) { layer.destroy(false); }); }

            mapObj._markers = {};
            _.each(mapObj._byView, function(viewConfig)
            {
                if (viewConfig._renderType == 'points'
                    && !$.subKeyDefined(viewConfig, '_animation.finished')) // FIXME: Hack.
                { viewConfig._displayLayer.removeAllFeatures(); }
                if (viewConfig._clusterBoundaries)
                { viewConfig._clusterBoundaries.removeAllFeatures(); }
            });
            delete mapObj._gradient;
        },

        reloadVisualization: function()
        {
            var mapObj = this;

            mapObj._boundsChanging = true;
            mapObj.initializeBaseLayers();
            mapObj.populateLayers();
            mapObj.initializeFlyouts((mapObj._displayFormat
                .plot || {}).descriptionColumns);

            mapObj._origData = {
                displayFormat: mapObj._displayFormat,
                mapType: mapObj._displayFormat.type,
                plotStyle: mapObj._displayFormat.plotStyle,
                layers: mapObj._displayFormat.layers};

            mapObj._super();
        },

        geolocate: function()
        {
            // Expected format: { address: '123 Main Street, Seattle, WA', radius: '5mi' }
            if (this._mapLoaded && !this._geolocationDone && this._displayFormat.geolocate)
            {
                this.map.getControlsByClass('blist.openLayers.GeocodeDialog')[0]
                    .geocode(this._displayFormat.geolocate);
                this._geolocationDone = true;
            }
        },

        fixMapLayers: function()
        {
            var mapObj = this;

            var $layers = mapObj.$dom().siblings('.mapLayers');
            var $bottom = $(mapObj.map.getControlsByClass('OpenLayers.Control.Attribution')[0].div);
            var height = ($bottom.filter(':visible').length == 0)
                ? mapObj.$dom().height() - 20 : $bottom.position().top - 10;
            height -= $layers.position().top + $layers.padding().top + $layers.padding().bottom;
            $layers.css('max-height', height);
            $layers.find('.contentBlock').css({
                'max-height': height-$layers.find('.toggleLayers').height(),
                'overflow': 'auto'});
        },

        populateLayers: function()
        {
            var mapObj = this;

            var $layers = mapObj.$dom().siblings('.mapLayers');
            var $layersList = $layers.find('ul');
            var $baseLayers = $layers.find('ul.base');
            var $dataLayers = $layers.find('ul.data');
            var dataLayers = (mapObj._dataLayers || []).concat(mapObj._displayLayers || []);

            if (mapObj._baseLayers.length < 2)
            { $baseLayers.hide(); $('h3.base').hide(); }
            if (dataLayers.length < 2)
            { $dataLayers.hide(); $('h3.data').hide(); }

            if (mapObj._baseLayers.length < 2 && dataLayers.length < 2)
            { return; }

            mapObj.fixMapLayers();

            $layersList.empty();
            var processLayer = function(l)
            {
                var lId = 'mapLayer_' + l.name;
                var opacity = _.isNull(l.opacity) ? 1 : l.opacity;
                $layerSet.append('<li data-layerid="' + l.id + '"' +
                    '><input type="checkbox" id="' + lId +
                    '"' + (l.visibility ? ' checked="checked"' : '') +
                    ' /><label for="' + lId + '">' + l.name + '</label>' +
                    '<br /><span class="sliderControl" data-min="0" data-max="100" ' +
                    'data-origvalue="' + (opacity*100) + '" />' +
                    '</li>');
                $layerSet.find('li:last').data('layer', l);
            };
            var $layerSet = $baseLayers;
            _.each(mapObj._baseLayers, processLayer);
            $layerSet = $dataLayers;
            _.each(dataLayers, processLayer);

            if (mapObj._baseLayers.length >= 2)
            { $baseLayers.show(); $('h3.base').show(); }
            if (dataLayers.length >= 2)
            { $dataLayers.show(); $('h3.data').show(); }

            $layersList.find('.sliderControl').each(function()
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
                    mapObj.events.changedVisibility(layer, newOpacity > 0);
                });
            });

            var reorderLayers = function(event, ui)
            {
                var layer = $(ui.item).data('layer');
                if (!layer) { return; }
                var index = $layersList.find('li').index(ui.item);

                var oldBaseLayer, newBaseLayer;
                if (index == 0)
                { oldBaseLayer = mapObj.map.baseLayer; newBaseLayer = layer; }
                else if (mapObj.map.getLayerIndex(layer) == 0)
                { oldBaseLayer = mapObj.map.layers[0]; newBaseLayer = mapObj.map.layers[1]; }

                if (oldBaseLayer && newBaseLayer)
                {
                    mapObj.map.setBaseLayer(newBaseLayer);
                    newBaseLayer.setIsBaseLayer(true);
                    oldBaseLayer.setIsBaseLayer(false);
                    oldBaseLayer.setVisibility(true);
                }
                mapObj.map.setLayerIndex(layer, index);
            };
            $layersList.sortable({containment: 'parent',
                placeholder: 'ui-state-highlight',
                forcePlaceholderSize: true, tolerance: 'pointer',
                update: reorderLayers, cancel: 'a.ui-slider-handle'
            });

            $layers.find(':checkbox').click(function(e)
            {
                var $check = $(e.currentTarget);
                var layer = $check.parent().data('layer')
                layer.setVisibility($check.value());
                mapObj.events.changedVisibility(layer, $check.value());
            });

            $layers.removeClass('hide');
        },

        hideLayers: function()
        {
            _.each(this._baseLayers, function(layer)
            { layer.setVisibility(false); });
            this.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0].deactivate();
        },

        showLayers: function()
        {
            _.each(this._baseLayers, function(layer)
            { layer.setVisibility(true); });
            this.map.getControlsByClass('blist.openLayers.MapTypeSwitcher')[0].activate();
        },

        handleRowsLoaded: function(rows, view)
        {
            if (this._byView[view.id]._renderType != 'points') { return; }
            else { this._super.apply(this, arguments); }
        },

        handleClustersLoaded: function(clusters, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];
            mapObj.renderClusters(clusters, view);
        },

        renderClusters: function(clusters, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            // For when animations are turned off.
            if (!viewConfig._animation
                && viewConfig._displayLayer instanceof OpenLayers.Layer.Vector)
            { viewConfig._displayLayer.removeAllFeatures(); }

            _.each(clusters, function(cluster)
            { mapObj.renderCluster(cluster, { dataView: view }); });

            mapObj._renderedRows += _.reduce(clusters, function(memo, cluster)
            { return memo + cluster.size; }, 0);

            mapObj.rowsRendered();

            if (_.all(viewConfig._displayLayer.features, function(feature)
                { return !feature.onScreen(); }))
            {
                viewConfig._fetchPoints = true;
                mapObj.getDataForView(view);
                delete viewConfig._fetchPoints;
                return;
            }

            viewConfig._lastClusterSet = _.map(clusters, function(cluster) { return cluster.id; });

            // If no animations or it's a gather animation, clear it out.
            if (viewConfig._animation && viewConfig._animation.direction == 'none')
            { viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds); }
        },

        generateFlyoutLayout: function(columns, noLabel, view)
        {
            var mapObj = this;
            var titleId = (view.displayFormat.plot || {}).titleId;
            if (_.isEmpty(columns) && $.isBlank(titleId))
            { return null; }

            var layout = mapObj._super(columns, noLabel);
            if ($.isBlank(layout))
            { layout = {columns: [{rows: []}]}; }
            var col = layout.columns[0];

            // Title row
            if (!$.isBlank(titleId))
            {
                col.rows.unshift({fields: [{type: 'columnData',
                    tableColumnId: titleId}
                ], styles: {'border-bottom': '1px solid #666666',
                    'font-size': '1.2em', 'font-weight': 'bold',
                    'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
            }

            return layout;
        },

        getFlyout: function(rows, details, dataView)
        {
            if (rows.length < 1) { return null; }

            var mapObj = this;
            var $info = $.tag({tagName: 'div', 'class': 'mapInfoContainer'});
            _.each(rows, function(r) { $info.append(mapObj.renderFlyout(r, dataView)); });

            if (rows.length > 1)
            {
                $info.children('.row').addClass('hide')
                    .first().removeClass('hide');
                $info.append($.tag({tagName: 'div', 'class': 'infoPaging',
                    contents: [
                        {tagName: 'a', 'class': ['previous', 'disabled'],
                            href: '#Previous', title: 'Previous row',
                            contents: '&lt; Previous'},
                        {tagName: 'a', 'class': 'next', href: '#Next',
                            title: 'Next row', contents: 'Next &gt;'}
                    ]
                }));
            }

            if (!mapObj._byView[dataView.id]._locCol) { return $info; }
            var loc = rows[0][mapObj._byView[dataView.id]._locCol.lookup];
            if (loc.latitude && loc.longitude)
            {
                if (mapObj._displayFormat.type == 'bing')
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://www.bing.com/maps/?where1='+loc.latitude+','+loc.longitude,
                    target: '_blank', contents: 'View in Bing Maps'})); }
                else
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://maps.google.com/maps?q='+loc.latitude+','+loc.longitude,
                    target: '_blank', contents: 'View in Google Maps'})); }
            }

            return $info;
        },

        rowToPoint: function(row, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (mapObj._displayFormat.noLocations && _.isUndefined(row.feature))
            { return true; }

            // A configured Location column always takes precedence.
            // _geoCol is and always will be a fallback.
            var locCol = viewConfig._locCol || viewConfig._geoCol;

            if (_.isUndefined(row.feature) && _.isUndefined(locCol) &&
                (_.isUndefined(viewConfig._latCol) || _.isUndefined(viewConfig._longCol)))
            {
                mapObj.errorMessage = 'No columns defined';
                return false;
            }

            var point = {isPoint: true};

            if (!_.isUndefined(row.feature))
            {
                var loc = row.feature.geometry;
                if (_.include([102100,102113,3857], loc.spatialReference.wkid))
                { loc = esri.geometry.webMercatorToGeographic(loc); }

                if (loc.type != 'point')
                { point.isPoint = false; }
                else
                {
                    point.latitude = loc.y;
                    point.longitude = loc.x;
                }
            }
            else if (!$.isBlank(locCol))
            {
                var loc = row[locCol.id];
                if ($.isBlank(loc)) { return true; }

                if (loc.geometry && (loc.geometry.rings || loc.geometry.paths))
                { point.isPoint = false; }
                else
                {
                    point.latitude = parseFloat(loc.latitude);
                    point.longitude = parseFloat(loc.longitude);
                }
            }
            else
            {
                point.latitude = parseFloat(row[viewConfig._latCol.id]);
                point.longitude = parseFloat(row[viewConfig._longCol.id]);
            }

            // Incomplete points will be safely ignored
            if (point.isPoint &&
                _.isNull(point.latitude) || _.isNaN(point.latitude) ||
                _.isNull(point.longitude) || _.isNaN(point.longitude)) { return true; }
            if (point.latitude <= -90 || point.latitude >= 90 ||
                    point.longitude <= -180 || point.longitude >= 180)
            {
                mapObj.errorMessage = 'Latitude must be between -90 and 90, ' +
                    'and longitude must be between -180 and 180';
                return false;
            }

            return point;
        },

        renderRow: function(row, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (mapObj._renderType == 'clusters') { return true; }

            var point = mapObj.rowToPoint(row, view);
            if (_.isBoolean(point)) { return point; }

            if (!viewConfig._llKeys) viewConfig._llKeys = {};
            var rowKey;
            if (point.isPoint)
            {
                rowKey = point.latitude.toString();
                rowKey += ',';
                rowKey += point.longitude.toString();
            }
            else if (row.feature)
            { rowKey = row.feature.attributes[viewConfig._objectIdKey]; }
            else
            { rowKey = view.id + row.id; } // too difficult to identify duplicates

            if (!viewConfig._llKeys[rowKey])
            { viewConfig._llKeys[rowKey] = { rows: [] }; }
            else
            { viewConfig._requestedRows--; } // Duplicates are non-requests; for snapshotting.

            var ri = viewConfig._llKeys[rowKey].rows.length;
            _.each(viewConfig._llKeys[rowKey].rows, function(cachedRow, i)
                { if (row.id == cachedRow.id) { ri = i; } });
            viewConfig._llKeys[rowKey].rows[ri] = row;

            var details = {rows: viewConfig._llKeys[rowKey].rows};
            if (viewConfig._iconCol && row[viewConfig._iconCol.id])
            {
                var icon;
                if (viewConfig._iconCol.dataTypeName == 'url')
                {
                    icon = row[viewConfig._iconCol.id].url;
                }
                else
                {
                    icon = viewConfig._iconCol.baseUrl()
                        + row[viewConfig._iconCol.id];
                }
                if (icon) { details.icon = icon; }
            }
            if (viewConfig._sizeValueCol
                && mapObj._segments[viewConfig._sizeValueCol.id])
            {
                for (var i = 0; i < mapObj._numSegments; i++)
                {
                    if (parseFloat(row[viewConfig._sizeValueCol.id]) <=
                        mapObj._segments[viewConfig._sizeValueCol.id][i])
                    { details.size = i + 1; break; }
                }
            }
            var color = (isNormalMap(view) ? view.displayFormat : mapObj._displayFormat).color;
            if (color)
            { details.color = color; }
            if (viewConfig._colorValueCol
                && mapObj._segments[viewConfig._colorValueCol.id])
            {
                for (var i = 0; i < mapObj._numSegments; i++)
                {
                    if (parseFloat(row[viewConfig._colorValueCol.id]) <=
                        mapObj._segments[viewConfig._colorValueCol.id][i])
                    {
                        var rgb = mapObj._gradient[i];
                        details.color = '#' + $.rgbToHex(rgb);
                        break;
                    }
                }
            }

            if (row.color)
            { details.color = row.color; }

            if (row.icon)
            { details.icon = row.icon; }

            if (viewConfig._quantityCol)
            { details.heatStrength = parseFloat(row[viewConfig._quantityCol.id]); }

            if (row.meta)
            {
                var mapping = { 'mapIcon': 'icon', 'heat': 'heatStrength',
                    'pinSize': 'size', 'pinColor': 'color' };
                _.each(_.keys(mapping), function(key)
                {
                    if (row.meta[key])
                    { details[mapping[key]] = row.meta[key]; }
                });
            }

            var locCol = viewConfig._locCol || viewConfig._geoCol;
            var geoType = (function() {
                if (row.feature)
                { return row.feature.geometry.type; }

                var geometry = row[locCol.id].geometry;
                if (geometry)
                {
                    if (geometry.rings)
                    { return 'polygon'; }
                    else if (geometry.paths)
                    { return 'polyline'; }
                }

                return 'point';
            })();

            if (geoType == 'point' && mapObj._primaryView._rowClusterParents)
            { details.clusterParent = mapObj._primaryView._rowClusterParents[row.sid]; }

            var geometry;
            switch (geoType)
            {
                case 'point':
                    geometry = { latitude: point.latitude, longitude: point.longitude };
                    break;
                case 'polygon':
                    geometry = { rings: row[locCol.id].geometry.rings };
                    break;
                case 'polyline':
                    geometry = { paths: row[locCol.id].geometry.paths };
                    break;
            }

            details.dataView = view;

            var graphic = mapObj.renderGeometry(geoType, geometry, rowKey, details);
            if (viewConfig._animation)
            {
                viewConfig._animation.news.push(graphic);
                viewConfig._animation.olds = _.without(viewConfig._animation.olds, graphic);
            }

            return graphic;
        },

        enqueueGeometry: function()
        {
            if (!this._geometryQueue)
            { this._geometryQueue = []; }
            this._geometryQueue.push(arguments);
        },

        renderGeometry: function(geoType, geometry, dupKey, details)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[(details.dataView || mapObj._primaryView).id];

            var hasHighlight = _.any(details.rows, function(r)
                { return r.sessionMeta && r.sessionMeta.highlight; });

            var marker, newMarker;
            if (mapObj._markers[dupKey])
            {
                marker = mapObj._markers[dupKey];
                if (hasHighlight != marker.style.hasHighlight
                    || marker.style.externalGraphic != details.icon)
                {
                    marker = null;
                    newMarker = true;
                    viewConfig._displayLayer.removeFeatures([mapObj._markers[dupKey]]);
                    delete mapObj._markers[dupKey];
                }
            }
            else
            { newMarker = true; viewConfig._adjustBounds = true; }

            if (geoType == 'point')
            {
                var lonlat;
                if (geometry instanceof OpenLayers.LonLat)
                { lonlat = geometry; }
                else
                { lonlat = new OpenLayers.LonLat(geometry.longitude, geometry.latitude); }
                lonlat.transform(geographicProjection, mapObj.map.getProjectionObject());

                if (!marker)
                { marker = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)); }
                else
                { viewConfig._adjustBounds = true; }

                marker.attributes.clusterParent = details.clusterParent;
                if (details.dataView)
                { marker.attributes.flyout = mapObj.getFlyout(details.rows,
                    details.flyoutDetails, details.dataView); }

                if (details.icon)
                { marker.style = iconCache(mapObj, details.icon, marker, hasHighlight); }
                else
                {
                    marker.style = marker.style || {};
                    marker.style.fillColor = hasHighlight ? '#' + mapObj._highlightColor
                                                          : details.color || '#0000ff';
                    marker.style.strokeColor = '#ffffff';
                    marker.style.strokeWidth = 2;
                    marker.style.pointRadius = marker.style.pointRadius || 5;

                    if (details.size)
                    { marker.style.pointRadius = 5 + (2 * details.size); }
                }

                if (!newMarker)
                { marker.move(lonlat); } // Feature/Vector#move calls drawFeature.
            }
            else if (geoType == 'polyline')
            {
                // TODO: When we actually use this code, throw this all out.
                var geo = new OpenLayers.Geometry.LineString(
                    _.map(geometry.paths, function(point, p)
                    { return new OpenLayers.Geometry.Point(point.x, point.y); }));
                marker = new OpenLayers.Feature.Vector(geo.transform(
                    new OpenLayers.Projection('EPSG:900913'), mapObj.map.getProjectionObject()), {},
                    { stroke: true, strokeColor: '#000000' }
                );
            }
            else if (geoType == 'polygon')
            {
                if (newMarker)
                {
                    marker = new OpenLayers.Feature.Vector(geometry.transform(
                        new OpenLayers.Projection('EPSG:900913'), mapObj.map.getProjectionObject()));
                }
                marker.style = {
                    fillColor: hasHighlight ? '#' + mapObj._highlightColor
                                            : (details.color || "#FF00FF"),
                    fillOpacity: _.isUndefined(details.opacity) ? 0.8 : details.opacity,
                    strokeColor: '#000000', strokeOpacity: 0.5
                };

                marker.attributes.flyout = mapObj.getFlyout(details.rows,
                    details.flyoutDetails, details.dataView);
                marker.attributes.redirects_to = details.redirect_to;

                viewConfig._displayLayer.drawFeature(marker);
            }

            marker.attributes.heatStrength = 1;
            marker.attributes.rows = details.rows;
            marker.attributes.dupKey = dupKey;
            marker.attributes.boundary = function() { return []; };

            if (newMarker)
            {
                mapObj._markers[dupKey] = marker;
                viewConfig._displayLayer.addFeatures([marker]);
            }

            return marker;
        },

        renderCluster: function(cluster, details)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[details.dataView.id];

            if (cluster.size <= 0) { return; }

            var cluster_icon = '/images/map_cluster_';
            var size;
            if (cluster.size < 100)
            { cluster_icon += 'small.png'; size = 37; }
            else if (cluster.size < 1000)
            { cluster_icon += 'med.png';   size = 45; }
            else
            { cluster_icon += 'large.png'; size = 65; }

            var lonlat = new OpenLayers.LonLat(cluster.centroid.lon, cluster.centroid.lat)
                .transform(geographicProjection, mapObj.map.getProjectionObject());

            var boundary = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(
                    _.map(cluster.polygon, function(vertex)
                    { return new OpenLayers.Geometry.Point(vertex.lon, vertex.lat); }))]).transform(
                geographicProjection, mapObj.map.getProjectionObject()), {},
                { fillColor: '#0000dd', fillOpacity: 0.2, strokeWidth: 3, strokeColor: '#000088' });

            var bbox = new OpenLayers.Bounds(cluster.box.lon1, cluster.box.lat1,
                                             cluster.box.lon2, cluster.box.lat2)
                        .transform(geographicProjection, mapObj.map.getProjectionObject());

            var marker = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
                { bbox: bbox, isCluster: true },
                { externalGraphic: cluster_icon,
                  graphicWidth: size, graphicHeight: size,
                  graphicXOffset: -(size/2), graphicYOffset: -(size/2),
                  label: ''+cluster.size, cursor: 'pointer'
                } );

            marker.attributes.heatStrength = cluster.size;
            marker.attributes.clusterParent = cluster.parent;
            marker.attributes.clusterId = cluster.id;

            marker.attributes.boundary = function()
            {
                if (this.boundaries) { return this.boundaries; }

                // If there are no children, just use the provided polygon.
                if (_.isEmpty(cluster.childBoxes))
                { this.boundaries = [boundary]; return this.boundaries; }

                // If the size of the bbox is small or thin, don't bother.
                var nwPixel = viewConfig._displayLayer.getViewPortPxFromLonLat(
                    new OpenLayers.LonLat(cluster.box.lon1, cluster.box.lat1).transform(
                        geographicProjection, mapObj.map.getProjectionObject()));
                var sePixel = viewConfig._displayLayer.getViewPortPxFromLonLat(
                    new OpenLayers.LonLat(cluster.box.lon2, cluster.box.lat2).transform(
                        geographicProjection, mapObj.map.getProjectionObject()));
                var bboxWidth  = Math.abs(sePixel.x - nwPixel.x);
                var bboxHeight = Math.abs(sePixel.y - nwPixel.y);
                marker.attributes.bboxArea = bboxWidth * bboxHeight;
                marker.attributes.bboxRatio = bboxWidth / bboxHeight;

                // This catches 1-point clusters, too, which are of area 0 and ratio NaN.
                // Current role model for "too big" is USGS Earthquakes, Carribean 55-point cluster.
                if (marker.attributes.bboxArea < 100000)
                { this.boundaries = [boundary]; return this.boundaries; }
                if (marker.attributes.bboxRatio < 0.01)
                { this.boundaries = [boundary]; return this.boundaries; }

                // Alright, build from child boxes.
                this.boundaries = _.map(cluster.childBoxes, function(box)
                {
                    var bbox = new OpenLayers.Bounds(box.lon1, box.lat1,
                                                     box.lon2, box.lat2)
                        .transform(geographicProjection, mapObj.map.getProjectionObject());
                    return new OpenLayers.Feature.Vector(bbox.toGeometry(), {},
                        { fillColor: '#00dd00', fillOpacity: 0.2,
                          strokeWidth: 2, strokeColor: '#008800'  });
                });

                // And add some lines.
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
            };

            if (viewConfig._animation && viewConfig._animation.direction == 'spread')
            { marker.style.display = 'none'; }

            viewConfig._displayLayer.addFeatures([marker]);
            if (viewConfig._animation)
            { viewConfig._animation.news.push(marker); }

            viewConfig._adjustBounds = true;

            return marker;
        },

        rowsRendered: function()
        {
            var mapObj = this;
            mapObj._super();

            if (mapObj._geometryQueue)
            { _.each(mapObj._geometryQueue,
                function(item) { mapObj.renderGeometry.apply(mapObj, item); }); }

            mapObj.adjustBounds();
            mapObj.runAnimation(function()
            {
                // This. Is such. A hack.
                _.each(mapObj._byView, function(viewConfig)
                {
                    if (!viewConfig._displayLayer) { return; }
                    $('circle, image, path, oval, rect, shape', viewConfig._displayLayer.div)
                        .filter(function()
                            { return !viewConfig._displayLayer.getFeatureById(this._featureId); })
                        .remove();
                });
            });

            // Create a copy of features on the wrong side of the dateline
            // and wrap around their X coordinate.
            // TODO: Wishing OpenLayers would do this automatically.
            if (mapObj._datelineHack && viewConfig._displayLayer)
            {
                _.each(mapObj._byView, function(viewConfig)
                {
                    var left = viewConfig._displayLayer.getExtent().left;
                    var difference
                        = (Math.abs(left)/left) * viewConfig._displayLayer.maxExtent.getWidth();
                    var features = _(viewConfig._displayLayer.features).chain()
                        .select(function(f) { return !f.onScreen(); })
                        .map(function(f) {
                            return new OpenLayers.Feature.Vector(
                                new OpenLayers.Geometry.Point(f.geometry.x + difference,
                                                              f.geometry.y),
                                $.extend({}, f.attributes, { datelineHack: true }),
                                f.style);
                        }).value();
                    viewConfig._displayLayer.addFeatures(features);
                });
            }

            _.each(mapObj._byView, function(viewConfig)
            {
                viewConfig._lastRenderType = viewConfig._renderType;
                if (viewConfig._clusterBoundaries)
                { viewConfig._clusterBoundaries.removeAllFeatures(); }

                // Only clusters on a point map.
                if (viewConfig._renderType == 'clusters')
                { mapObj.mapElementLoaded(); }
                // Only points on a point map.
                else if (viewConfig._displayLayer
                    && !mapObj._featureSet && !viewConfig._heatmapLayer)
                {
                    var renderedRows = viewConfig._displayLayer.features.length;
                    if (renderedRows >= _.size(viewConfig._llKeys)
                        && renderedRows >= viewConfig._requestedRows)
                    { mapObj.mapElementLoaded(); }
                }
            });
            mapObj.geolocate();
            mapObj._lastZoomLevel = mapObj.currentZoom();
        },

        adjustBounds: function()
        {
            var mapObj = this;
            if ($.subKeyDefined(mapObj, '_primaryView.query.namedFilters.viewport'))
            { return; }

            mapObj._boundsChanging = true;
            if (mapObj._displayFormat.viewport
                && _.any(mapObj._byView, function(viewConfig) { return viewConfig._adjustBounds; }))
            { mapObj.setViewport(mapObj._displayFormat.viewport); }
            else
            {
                var displayLayers = _(mapObj._byView).chain()
                    .select(function(viewConfig) { return viewConfig._adjustBounds; })
                    .map(function(viewConfig)  {  return viewConfig._displayLayer; })
                    .value();
                if (_.isEmpty(displayLayers)) return;

                var bounds = _.reduce(displayLayers, function(memo, layer)
                    {
                        if (memo)
                        { memo.extend(layer.getDataExtent()); return memo; }
                        else
                        { return layer.getDataExtent(); }
                    },
                    null);
                if (!_.isUndefined(bounds.left)) // Quick way to check for validity of bounds.
                { mapObj.map.zoomToExtent(bounds); }
            }
            _.each(mapObj._byView, function(viewConfig) { viewConfig._adjustBounds = false; });
        },

        getViewport: function()
        {
            var mapObj = this;
            var extent = mapObj.map.getExtent();
            if (!extent) { return null; }
            extent = extent.transform(mapObj.map.getProjectionObject(), geographicProjection)
                           .toArray();
            var vp = { xmin: extent[0], ymin: extent[1], xmax: extent[2], ymax: extent[3] };

            // Test for wraparound.
            // Weird fact: cloning the extent above to minimize calcs didn't work.
            // Could be a mistake on my part. Doesn't make sense.
            var xmin =
                mapObj.map.baseLayer.getViewPortPxFromLonLat(new OpenLayers.LonLat(vp.xmin, vp.ymin)
                    .transform(geographicProjection, mapObj.map.getProjectionObject()));
            var xmax =
                mapObj.map.baseLayer.getViewPortPxFromLonLat(new OpenLayers.LonLat(vp.xmax, vp.ymin)
                    .transform(geographicProjection, mapObj.map.getProjectionObject()));
            var size = mapObj.map.getSize();

            // If each boundary is onscreen and within 10 pixels of the edge, yay.
            if (xmin.x > 10 && xmin.x < size.w)
            { vp.xmin = -180; }
            if (xmax.x > 0 && Math.abs(xmax.x - size.w) > 10)
            { vp.xmax = 180; }

            // OpenLayers can't display both sides of the dateline at once normally.
            mapObj._datelineHack = vp.xmin > vp.xmax;

            if (!$.isBlank(vp))
            {
                _.each(['xmin', 'ymin', 'xmax', 'ymax'], function(key)
                {
                    vp[key] = parseFloat(($.jsonIntToFloat(vp[key]) || 0).
                        toFixed(mapObj.settings.coordinatePrecision));
                });
            }
            return vp;
        },

        setViewport: function(viewport)
        {
            if (_.isEqual(viewport, this.getViewport() || {})) { return; }
            var bounds = new OpenLayers.Bounds(viewport.xmin, viewport.ymin,
                                               viewport.xmax, viewport.ymax);

            // Hack: zoomToExtent's getCenterLonLat goes nuts if it tries to capture an
            // extent that goes past the dateline. This triggers an if-statement inside.
            var tmp = this.map.baseLayer.wrapDateLine;
            this.map.baseLayer.wrapDateLine = true;
            this.map.zoomToExtent(bounds.transform(geographicProjection,
                                                   this.map.getProjectionObject()));
            this.map.baseLayer.wrapDateLine = tmp;
        },

        fitPoint: function(point)
        {
            var p = new OpenLayers.LonLat(point.longitude, point.latitude);
            p.transform(geographicProjection, this.map.getProjectionObject());
            if (!this.map.getExtent().containsLonLat(p))
            { this.map.setCenter(p); }
        },

        updateRowsByViewport: function(viewport)
        {
            var mapObj = this;
            if (mapObj._displayFormat.plotStyle == 'heatmap') { return; }
            if (!viewport || !viewport.xmin) { viewport = mapObj.getViewport(); }
            if (!$.subKeyDefined(viewport, 'xmin'))
            {
                mapObj._needsViewportUpdate = true;
                return;
            }

            _.each(mapObj._dataViews, function(view)
            {
                var viewConfig = mapObj._byView[view.id];
                var filterColumn = viewConfig._locCol || viewConfig._geoCol;
                if ($.isBlank(filterColumn)
                    || !_.include(['location', 'geospatial'], filterColumn.renderTypeName))
                { return; }

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
                                        columnId: filterColumn.id
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

                var query = $.extend(true, {}, view.query);
                var filterCondition = {temporary: true, displayTypes: ['map']};
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

                if ((query.namedFilters || {}).viewport)
                { delete query.namedFilters.viewport; }
                query.namedFilters = $.extend(true, query.namedFilters || {},
                    { viewport: filterCondition });
                mapObj._updatingViewport = true;
                view.update({query: query}, false, true);
                viewConfig._viewportChanged = true;
            });
        },

        updateDatasetViewport: function(isAutomatic)
        {
            var mapObj = this;
            var vp = mapObj.getViewport();
            // Theory: All of these will be different if user-initiated
            // panning or zooming occurs. But one will hold constant if
            // it's just automatic.
            // Use the most recently set viewport
            var curVP = mapObj._currentViewport || {};
            if (isAutomatic || _.any(['xmin', 'ymin', 'ymax'], function(p)
                {
                    return vp[p].toFixed(mapObj.settings.coordinatePrecision) ==
                        (parseFloat(curVP[p]) || 0).toFixed(mapObj.settings.coordinatePrecision);
                }))
            {
                // If automatic and we have selected rows, make sure at least one is
                // in the viewport
                if (!_.isEmpty((mapObj._primaryView.highlightTypes || {}).select))
                {
                    var p = mapObj.rowToPoint(_.first(_.values(
                                    mapObj._primaryView.highlightTypes.select)), mapObj._primaryView);
                    if ((p || {}).isPoint)
                    { mapObj.fitPoint(p); }
                }
                return;
            }

            mapObj._currentViewport = vp;
            mapObj._willfullyIgnoreReload = true;
            mapObj._primaryView.update({displayFormat: $.extend({},
                mapObj._displayFormat, { viewport: vp })}, false, true);
        },

        resizeHandle: function(event)
        {
            // Implement if you need to do anything on resize
            var mapObj = this;

            mapObj._isResize = true;
            _.defer(function(){
                if (mapObj.map) { mapObj.map.updateSize(); }

                // Bug #6327. This breaks things for Mac/FF at the very least, so we're testing
                // for user agent. May need to persist this into Chrome 19.
                if (navigator.userAgent.indexOf('Chrome/18') > -1)
                {
                    var fixOffsetLeft = function(layer)
                    {
                        if (!(layer && layer instanceof OpenLayers.Layer.Vector)) { return; }
                        var $root = $(layer.renderer.root);
                        var $svg = $root.parent();
                        var $div = $svg.parent();
                        if ($svg.offset().left > $div.offset().left)
                        {
                            var offset = $svg.offset();
                            if (blist.sidebarPosition == 'left')
                            { offset.left -= $div.offset().left / 2; }
                            else
                            { offset.left = 0; }
                            $svg.offset(offset);
                        }
                    };

                    fixOffsetLeft(mapObj._byView[mapObj._primaryView.id]._displayLayer);
                    fixOffsetLeft(mapObj._byView[mapObj._primaryView.id]._clusterBoundaries);
                }
            });
        },

        getColumns: function()
        {
            var mapObj = this;
            var view = mapObj._primaryView;

            _.each(mapObj._dataViews, function(view)
            {
                var viewConfig = mapObj._byView[view.id];

                // For updateColumnsByViewport to filter on geometries.
                viewConfig._geoCol = _.detect(view.realColumns, function(col)
                    { return _.include(['geospatial', 'location'],
                                       col.renderTypeName); });

                viewConfig._objectIdCol = _.detect(view.realColumns, function(col)
                    { return col.name.toUpperCase() == 'OBJECTID'; });
                viewConfig._objectIdKey = (viewConfig._objectIdCol || {}).name;

                if (!$.subKeyDefined(mapObj._displayFormat, 'plot'))
                { return; }

                // Preferred location column
                if (!$.isBlank(mapObj._displayFormat.plot.locationId))
                { viewConfig._locCol =
                    view.columnForIdentifier(mapObj._displayFormat.plot.locationId); }

                viewConfig._redirectCol =
                    view.columnForIdentifier(mapObj._displayFormat.plot.redirectId);

                viewConfig._iconCol =
                    view.columnForIdentifier(mapObj._displayFormat.plot.iconId);

                if (view == mapObj._primaryView)
                {
                    var aggs = {};
                    _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
                    {
                        var c = view.columnForIdentifier(
                            mapObj._displayFormat.plot[colName + 'Id']);
                        if (!$.isBlank(c))
                        {
                            viewConfig['_' + colName + 'Col'] = c;
                            aggs[c.id] = ['maximum', 'minimum'];
                            if (colName == 'quantity')
                            { aggs[c.id].push('sum'); }
                        }
                    });

                    if (!_.isEmpty(aggs))
                    {
                        if (!mapObj._delayRenderData) { mapObj._delayRenderData = 0; }
                        mapObj._delayRenderData++;

                        view.getAggregates(function()
                        { calculateSegmentSizes(mapObj, aggs); }, aggs);
                    }
                }
            });

            return true;
        },

        getDataForAllViews: function()
        {
            var mapObj = this;

            if (!mapObj.isValid()) { return; }

            if (mapObj._displayFormat.plotStyle == 'heatmap')
            {
                mapObj._byView[mapObj._primaryView.id]._renderType = 'points';
                mapObj._byView[mapObj._primaryView.id]._neverCluster = true;
            }

            mapObj._super();

            mapObj.buildSelectControl();
        },

        buildSelectControl: function()
        {
            var mapObj = this;

            if (!mapObj._selectControl)
            {
                var unselectFeature = function(feature)
                {
                    if (feature && feature.layer)
                    { feature.layer.dataView.unhighlightRows(feature.attributes.rows, 'select'); }
                    mapObj.closePopup();
                };

                // FIXME: Polymorphism, where art thou?
                mapObj._selectControl = new OpenLayers.Control.SelectFeature(mapObj._displayLayers,
                { 'hover': true, 'callbacks': {
                    'click': function(feature)
                    {
                        var layer = feature.layer;
                        var view = layer.dataView;
                        var viewConfig = layer.dataViewConfig;

                        if (viewConfig._renderType == 'clusters')
                        {
                            if (mapObj.currentZoom()
                                < mapObj.map.getZoomForExtent(feature.attributes.bbox))
                            { mapObj.map.zoomToExtent(feature.attributes.bbox); }
                            else
                            {
                                mapObj.map.setCenter(
                                    feature.geometry.getBounds().getCenterLonLat(),
                                    mapObj.currentZoom() + 1);
                            }
                        }
                        else
                        {
                            var lonlat = layer.getLonLatFromViewPortPx(mapObj._lastClickAt);
                            onFeatureSelect(mapObj, feature, lonlat, function(evt)
                                {
                                    if (!feature.layer)
                                    { feature = mapObj._markers[feature.attributes.dupKey]; }
                                    unselectFeature(feature);
                                });
                            var dupKey = view.id + feature.attributes.dupKey;
                            if (!$.isBlank(mapObj._hoverTimers[dupKey]))
                            {
                                clearTimeout(mapObj._hoverTimers[dupKey]);
                                delete mapObj._hoverTimers[dupKey];
                            }
                        }
                    },
                    'over': function(feature)
                    {
                        var view = feature.layer.dataView;
                        var viewConfig = feature.layer.dataViewConfig;

                        if (viewConfig._renderType == 'clusters')
                        { viewConfig._clusterBoundaries
                            .addFeatures(feature.attributes.boundary()); }
                        else
                        {
                            var dupKey = view.id + feature.attributes.dupKey;
                            if (!$.isBlank(mapObj._hoverTimers[dupKey]))
                            {
                                clearTimeout(mapObj._hoverTimers[dupKey]);
                                delete mapObj._hoverTimers[dupKey];
                            }
                            view.highlightRows(feature.attributes.rows);
                        }
                    },
                    'out': function(feature)
                    {
                        var view = feature.layer.dataView;
                        var viewConfig = feature.layer.dataViewConfig;

                        if (viewConfig._renderType == 'clusters')
                        { viewConfig._clusterBoundaries.removeAllFeatures(); }
                        else
                        {
                            var dupKey = view.id + feature.attributes.dupKey;
                            mapObj._hoverTimers[dupKey] = setTimeout(function()
                                {
                                    delete mapObj._hoverTimers[dupKey];
                                    view.unhighlightRows(feature.attributes.rows);
                                }, 100);
                        }
                    }
                }});
                mapObj.map.addControl(mapObj._selectControl);
                mapObj._selectControl.activate();

                // This is to allow us to drag when (for example) clicking on a polygon.
                // It is probably the best way to do this, short of modifying SelectFeature.
                mapObj._selectControl.handlers.feature.stopDown = false;
            }
            else
            { mapObj._selectControl.setLayer(mapObj._displayLayers); }
        },

        getDataForView: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (!viewConfig._displayLayer)
            {
                viewConfig._displayLayer = mapObj.buildViewLayer(view);
                viewConfig._clusterBoundaries = new OpenLayers.Layer.Vector();
                mapObj.map.addLayer(viewConfig._clusterBoundaries);
                mapObj.map.addLayer(viewConfig._displayLayer);
            }

            var viewport = mapObj._displayFormat.viewport || { 'xmin': -180, 'xmax': 180,
                                                               'ymin': -90,  'ymax': 90 };

            if (viewConfig._neverCluster || viewConfig._fetchPoints)
            {
                viewConfig._renderType = 'points';
                if (!viewConfig._animation)
                { mapObj.initializeAnimation(null, view); }
                if (view.displayFormat.viewport
                    && !$.subKeyDefined(view, 'query.namedFilters.viewport'))
                {
                    mapObj.updateRowsByViewport(viewport);
                    // This isn't a viewport update; we're setting it for the first time.
                    delete mapObj._updatingViewport;
                }
                mapObj._super(view);
                mapObj._boundsChanging = true;
                if (!mapObj._mapLoaded)
                { mapObj.setViewport(viewport); }
                if (viewConfig._fetchPoints)
                { delete viewConfig._fetchPoints; }
                return;
            }

            // Size of a medium cluster, to minimize cluster overlap.
            var pixels = 45;

            viewConfig._renderType = 'clusters';
            view.getClusters(viewport, view.displayFormat,
                mapObj.getMinDistanceForViewportPixels(viewport, pixels),
                function(data)
            {
                if (_.isUndefined(viewConfig._neverCluster))
                {
                    var totalRows = view.totalRows();
                    if (totalRows)
                    { viewConfig._neverCluster = totalRows < mapObj._maxRows; }
                }
                if (viewConfig._neverCluster)
                {
                    viewConfig._renderType = 'points';
                    mapObj.clearGeometries();
                    mapObj.getDataForView(view);
                    return;
                }

                if (!mapObj._displayFormat.viewport)
                {
                    var boundsObj = _.reduce(data, function(memo, cluster)
                        {
                            var bounds = new OpenLayers.Bounds(cluster.box.lon1, cluster.box.lat1,
                                                               cluster.box.lon2, cluster.box.lat2);
                            if (!memo) { return bounds; }
                            else { memo.extend(bounds); return memo; }
                        }, null).toArray();
                    var vp = { xmin: boundsObj[0], ymin: boundsObj[1],
                               xmax: boundsObj[2], ymax: boundsObj[3] };
                    mapObj._displayFormat.viewport = vp;
                    mapObj.getDataForView(view);
                    return;
                }

                var rowsAvailable = _.reduce(data, function(memo, cluster)
                    { return memo + cluster.size; }, 0);

                // The divide by 2 is fairly arbitrary; I just didn't want the threshold so high.
                if (rowsAvailable <= mapObj._maxRows / 2)
                {
                    viewConfig._fetchPoints = true;
                    viewConfig._renderType = 'points';
                    mapObj.initializeAnimation(data, view);
                    mapObj.getDataForView(view);
                    delete viewConfig._fetchPoints;
                    return;
                }

                mapObj.initializeAnimation(data, view);

                if (viewConfig._renderType == 'clusters')
                { _.defer(function() { mapObj.handleClustersLoaded(data, view); }); }

                mapObj.totalRowsForAllViews();
                delete mapObj._initialLoad;
            },
            function()
            {
                // On error clear these variables so more requests will be triggered
                delete mapObj._initialLoad;
                viewConfig._fetchPoints = true;
                mapObj.getDataForView(view);
            });
        },

        buildViewLayer: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];
            var layer = viewConfig._displayLayer = new OpenLayers.Layer.Vector(view.name);
            viewConfig._displayLayer.dataView = view;
            viewConfig._displayLayer.dataViewConfig = viewConfig;

            mapObj._displayLayers.push(viewConfig._displayLayer);

            mapObj.populateLayers();

            return layer;
        },

        initializeAnimation: function(data, view)
        {
            if (animationOff) { return; }
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            viewConfig._animation = { news: [] };
            if (mapObj._displayFormat.plotStyle != 'point') { return; }
            if (_.isEmpty(data)) { return; }

            viewConfig._animation.olds = _.clone(viewConfig._displayLayer.features);

            if (
                // First load
                _.isUndefined(mapObj._lastZoomLevel)
                // Panned
                || mapObj.currentZoom() == mapObj._lastZoomLevel
                // Same set of clusters as the last zoom level.
                || (_.all([viewConfig._renderType, viewConfig._lastRenderType],
                        function(type) { return type == 'clusters'; })
                    && _.all(data, function(cluster)
                    { return _.include(viewConfig._lastClusterSet || [], cluster.id); }))
                // Points do not animate into other points.
                || _.all([viewConfig._renderType, viewConfig._lastRenderType],
                        function(type) { return type == 'points'; }))
            { viewConfig._animation.direction = 'none'; }
            else if (mapObj.currentZoom() < mapObj._lastZoomLevel)
            { viewConfig._animation.direction = 'gather'; }
            else
            { viewConfig._animation.direction = 'spread'; }

            animated = false;
        },

        runAnimation: function(callback)
        {
            var mapObj = this;

            // If two views are going in different directions, we're kinda fucked anyways.
            var direction = _.detect(mapObj._byView, function(viewConfig)
                { return viewConfig._animation
                        && !viewConfig._animation.finished
                        && viewConfig._animation.direction != 'none'; });
            direction = ((direction || {})._animation || {}).direction;

            // Either there's only one view, or nothing is going to happen.
            if (!direction)
            {
                _.each(mapObj._byView, function(viewConfig)
                { viewConfig._displayLayer &&
                    _.isFunction(viewConfig._displayLayer.removeFeatures) &&
                    viewConfig._animation &&
                    viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds); });
                if (_.isFunction(callback))
                { callback(); }
                return;
            }

            var animKey  = direction == 'spread' ? 'news' : 'olds';
            var otherKey = direction == 'gather' ? 'news' : 'olds';
            var animations = _.reduce(mapObj._byView, function(memo, viewConfig)
            {
                if (!viewConfig._animation || viewConfig._animation.direction == 'none')
                { return memo; }

                return memo.concat(_.compact(_.map(viewConfig._animation[animKey],
                    function(feature)
                    {
                        if (!feature.attributes.clusterParent) { return; }

                        var animation = { duration: 1000 };
                        animation.feature = feature;
                        var otherNode = _.detect(viewConfig._animation[otherKey], function(m)
                        { return feature.attributes.clusterParent.id == m.attributes.clusterId; });

                        if (!otherNode && !$.subKeyDefined(feature, 'attributes.clusterParent'))
                        { return; }

                        var otherNodeLonLat =
                            new OpenLayers.LonLat(feature.attributes.clusterParent.centroid.lon,
                                                  feature.attributes.clusterParent.centroid.lat)
                                .transform(geographicProjection, mapObj.map.getProjectionObject());

                        if (direction == 'spread')
                        {
                            animation.from = otherNode
                                                ? otherNode.geometry.getBounds().getCenterLonLat()
                                                : otherNodeLonLat;
                            animation.to   = feature.geometry.getBounds().getCenterLonLat();
                        }
                        else
                        {
                            animation.to = otherNode
                                                ? otherNode.geometry.getBounds().getCenterLonLat()
                                                : otherNodeLonLat;
                            animation.from = feature.geometry.getBounds().getCenterLonLat();
                        }

                        return animation;
                    })));
            }, []);

            if (direction == 'spread')
            {
                _.each(mapObj._byView, function(viewConfig)
                {
                    viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds);
                    _.each(viewConfig._animation.news, function(feature)
                    { delete feature.style.display; });
                });
            }
            setTimeout(function()
            {
                killAnimation = true;
                if (_.isFunction(window.killingAnimations)) { window.killingAnimations(); }
                _.each(animations, function(animation)
                {
                    animation.feature.move(animation.to);
                    animation.feature.attributes.animating = false;
                });
            }, 2000);
            animate(animations, function() { _.each(mapObj._byView, function(viewConfig)
                {
                    viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds);
                    _.each(viewConfig._animation.news, function(feature)
                    { viewConfig._displayLayer.drawFeature(feature); });
                    viewConfig._animation.finished = true;
                    if (_.isFunction(callback))
                    { callback(); }
                }); });
        },

        showPopup: function(lonlat, contents, options)
        {
            var mapObj = this;

            options = options || {};
            var closeBoxCallback = _.isFunction(options.closeBoxCallback)
                ? options.closeBoxCallback : function() { mapObj.closePopup(); };

            if (mapObj._popup && !options.keepOpen) { mapObj.closePopup(true); }

            var popup = new OpenLayers.Popup.FramedCloud(null,
                lonlat, null, contents, null, true,
                function(evt) { new jQuery.Event(evt).stopPropagation(); closeBoxCallback(); });
            if (options.dupKey)
            { popup.dupKey = options.dupKey; }
            mapObj._popup = popup;
            mapObj.map.addPopup(popup);

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
                    var href = $a.attr('href');
                    $(document).trigger(blist.events.DISPLAY_ROW,
                        [href.slice(href.lastIndexOf('/') + 1)]);
                });

        },

        closePopup: function(suppressUnselect)
        {
            var mapObj = this;

            if (!mapObj._popup) { return; }

            var feature = mapObj._markers[mapObj._popup.dupKey];
            if (feature.attributes.rows && feature.layer)
            { feature.layer.dataView.unhighlightRows(feature.attributes.rows, 'select'); }

            mapObj.map.removePopup(mapObj._popup);
            mapObj._popup.destroy();
            mapObj._popup = null;

            if (!suppressUnselect)
            {
                mapObj.$dom().trigger('display_row', [{row: null}]);
                $(document).trigger(blist.events.DISPLAY_ROW, [null, true]);
            }
        },

        $legend: function(options)
        {
            var mapObj = this;
            if (options == null) { return mapObj._legend; }

            var SWATCH_WIDTH = 17;

            if (!mapObj._legend)
            { mapObj._legend = { minimum: '', maximum: '' }; }

            if (!mapObj.$dom().siblings('.mapLegend').length)
            {
                mapObj.$dom().before('<div class="mapLegend">' +
                    '<div class="contentBlock">' +
                    '<h3></h3><div style="width: ' +
                    (mapObj._numSegments*SWATCH_WIDTH) +
                    'px;"><ul></ul><span>' +
                    mapObj._legend.minimum + '</span>' +
                    '<span style="float: right;">' +
                    mapObj._legend.maximum + '</span></div>' +
                    '</div></div>');
            }
            if (!mapObj._legend.$dom)
            { mapObj._legend.$dom = mapObj.$dom().siblings('.mapLegend').hide(); }

            if (options.name)
            { mapObj._legend.$dom.find('h3').text(options.name); }

            if (options.gradient)
            {
                var $ul = mapObj._legend.$dom.find('ul');
                $ul.empty();
                _.each(options.gradient, function(color)
                    {
                        $ul.append( $("<div class='color_swatch'>" +
                            "<div class='inner'>&nbsp;</div></div>")
                                .css('background-color', color)
                            );
                    }
                );
                mapObj._legend.gradientSet = true;
            }

            if (!$.isBlank(options.minimum))
            {
                mapObj._legend.minimum = options.minimum;
                if (mapObj._legend.$dom)
                { mapObj._legend.$dom.find('span:first').text(options.minimum); }
            }
            if (!$.isBlank(options.maximum))
            {
                mapObj._legend.maximum = options.maximum;
                if (mapObj._legend.$dom)
                { mapObj._legend.$dom.find('span:last').text(options.maximum); }
            }

            if (mapObj._legend.gradientSet)
            { mapObj._legend.$dom.show(); }
        }
    }, {
        defaultZoom: 1,
        coordinatePrecision: 6,
        iconScaleFactor: 1.2
    }, 'socrataVisualization');

    var calculateSegmentSizes = function(mapObj, aggs)
    {
        _.each(aggs, function(a, cId)
        {
            var column = mapObj._primaryView.columnForID(cId);
            var difference = column.aggregates.maximum - column.aggregates.minimum;
            var granularity = difference / mapObj._numSegments;

            mapObj._segments[column.id] = [];
            for (i = 0; i < mapObj._numSegments; i++)
            {
                mapObj._segments[column.id][i] =
                    ((i+1)*granularity) + column.aggregates.minimum;
            }

            mapObj.$legend({
                minimum: column.aggregates.minimum,
                maximum: column.aggregates.maximum
            });
        });

        mapObj._delayRenderData--;
        if (!mapObj._delayRenderData && mapObj._delayedRenderData)
        {
            _.each(mapObj._delayedRenderData, function(f) { f(); });
            mapObj._delayedRenderData = [];
        }
    };

    var onFeatureSelect = function(mapObj, feature, lonlat, closeBoxCallback)
    {
        if ((feature.attributes || {}).redirects_to)
        { window.open(feature.attributes.redirects_to); return; }

        if (!_.isEmpty(feature.attributes.rows))
        {
            feature.layer.dataView.highlightRows(feature.attributes.rows, 'select');
            mapObj.$dom().trigger('display_row',
                [{row: _.first(feature.attributes.rows)}]);
            $(document).trigger(blist.events.DISPLAY_ROW,
                [_.first(feature.attributes.rows).id, true]);
        }

        if (!feature.attributes.flyout)
        { return null; }

        mapObj.showPopup(lonlat, feature.attributes.flyout[0].innerHTML,
                         { dupKey: feature.attributes.dupKey, closeBoxCallback: closeBoxCallback });
    };

    var iconCache = function(mapObj, url, feature, hasHighlight)
    {
        if (!mapObj._iconCache)
        { mapObj._iconCache = {}; }

        if (!url)
        { url = '/images/openlayers/marker.png'; }

        var key = url;
        if (hasHighlight) { key += '|highlight=true'; }

        if (!mapObj._iconCache[key])
        {
            mapObj._iconCache[key] = { externalGraphic: url, features: [] };
            var image = new Image();
            image.onload = function()
            {
                var sf = mapObj.settings.iconScaleFactor;
                var width = hasHighlight ? image.width * sf : image.width;
                var height = hasHighlight ? image.height * sf : image.height;

                $.extend(mapObj._iconCache[key], {
                    graphicWidth: width, graphicHeight: height,
                    graphicXOffset: -(width / 2), graphicYOffset: -height
                });

                if (hasHighlight)
                { mapObj._iconCache[key].hasHighlight = true; }

                var features = mapObj._iconCache[key].features.concat(feature);
                _.each(features, function(f)
                {
                    f.style = mapObj._iconCache[key];
                    if (f.layer) { f.layer.drawFeature(f); }
                });
                mapObj._iconCache[key].features = [];
            };
            image.src = url;
        }
        else
        { mapObj._iconCache[key].features.push(feature); }

        return mapObj._iconCache[key];
    };

    var findFeatureFromEvent = function(mapObj, evt)
    {
        return _(mapObj._displayLayers).chain()
            .map(function(layer)
                { return { layer: layer, feature: layer.getFeatureFromEvent(evt) }; })
            .reject(function(datum)
                { return !datum.feature; })
            .value();
    };

    var animated = false;
    var animate = function(animations, callback)
    {
        if (animated) { return; }
        animated = true;
        var startTime = $.now();
        var interval;
        var debugging = !_.isUndefined(window.animations);
        if (debugging)
        { window.newAnimationSet($.extract(mapObj._byView, '_animation'), animations.length); }

        var step = function()
        {
            if (killAnimation) { killAnimation = false; return; }

            if (requestAnimationFrame && animations.length > 0)
            { requestAnimationFrame( step ); }

            if (debugging) { window.rememberAnimation({ left: animations.length }); }
            animations = _.reject(animations, function(animation, index)
            {
                if (!animation.finished && !killAnimation)
                {
                    animation.feature.attributes.animating = true;
                    var p = ($.now() - startTime) / animation.duration;
                    animation.finished = p >= 1;
                    var delta = function(start, end)
                    {
                        var pos = ((-Math.cos(p*Math.PI)/2) + 0.5);
                        return start + ((end - start) * pos);
                    };
                    var lonlat = new OpenLayers.LonLat(
                                               delta(animation.from.lon, animation.to.lon),
                                               delta(animation.from.lat, animation.to.lat));
                    animation.feature.move(lonlat);
                    return false;
                }
                animation.feature.attributes.animating = false;
                animation.feature.move(animation.to);
                if (_.isFunction(animation.callback))
                { animation.callback(); }
                return true;
            });

            if (animations.length == 0)
            {
                if (!requestAnimationFrame)
                { clearInterval( interval ); }
                if (_.isFunction(callback))
                { callback(); }
                killAnimation = false;
            }
        };
        if (requestAnimationFrame)
        { requestAnimationFrame( step ); }
        else
        { interval = setInterval( step, 13 ); }
    };

})(jQuery);
