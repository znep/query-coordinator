(function($)
{
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    blist.namespace.fetch('blist.openLayers');

    $.Control.extend('socrataMap', {
        isValid: function()
        {
            return Dataset.map.isValid(this._primaryView, this._displayFormat);
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

        initializeVisualization: function ()
        {
            var mapObj = this;

            if (!mapObj._displayFormat.viewDefinitions)
            { Dataset.map.convertToVersion2(mapObj._primaryView, mapObj._displayFormat); }

            mapObj.rowsRemaining = mapObj._maxRows;

            var mapOptions =
            {
                theme: null,
                projection: 'EPSG:900913',
                displayProjection: blist.openLayers.geographicProjection,
                units: 'm',
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                  20037508.34,  20037508.34),
                restrictedExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                         20037508.34,  20037508.34),
                maxResolution: 156543.0339,
                numZoomLevels: 21
            }

            if (mapObj._displayFormat.disableNavigation)
            { mapOptions.disableNavigation = true; }

            OpenLayers.ImgPath = '/images/openlayers/';

            mapObj.map = new blist.openLayers.Map(mapObj.$dom()[0], mapOptions);

            mapObj.map.escapeToClosePopup = function()
            {
                this.escapeClause = function(evt)
                { if (evt.keyCode == 27) { mapObj.closePopup(null, true); } };
                OpenLayers.Handler.Keyboard( this, {
                    'keyup': this.escapeClause,
                    'keydown': this.escapeClause
                });
            };

            mapObj._controls = {};
            _.each([ 'ZoomBar', 'MapTypeSwitcher', 'Overview', 'IconCache', 'GeocodeDialog' ],
            function(c)
            { mapObj._controls[c] = mapObj.map.getControlsByClass('blist.openLayers.' + c)[0]; });

            if (mapObj._displayFormat.disableGeolocator)
            { mapObj._controls.GeocodeDialog.deactivate(); }

            mapObj.map.events.register('preaddlayer', mapObj,
                function() { if (mapObj._viewportHandler) { mapObj._viewportHandler.expect(); } });

            var datasetsLoaded = function()
            {
                // TODO: Decide whether or not this is a good idea.
                if (_.isEmpty(mapObj._children))
                { mapObj.map.setCenter(new OpenLayers.LonLat(0,0)); }
                else if (mapObj.viewportHandler().viewportInOriginal)
                { mapObj.viewportHandler().resetToOriginal(); }

                // For split views.
                mapObj._primaryView.childViews = _.flatten(_.map(mapObj._children, function(c)
                {
                    if (c._view.childViews) { return c._view.childViews; }
                    else { return c._view.id; }
                }));

                _.each(mapObj._children, function(childView)
                { childView.bindDatasetEvents(); });

                mapObj.restackDataLayers();

                mapObj.initializeEvents();

                mapObj.getDataForChildren();

                mapObj._primaryView.trigger('row_count_change'); // DEBUG EZMODE Sidebar ready.

                mapObj.viewportHandler().events.register('viewportchanged', null,
                    function() { mapObj._panning = true; });
            };

            mapObj._children = [];
            var id = mapObj.$dom().attr('id');
            var constructChildView = function(df, index)
            {
                if (mapObj._children[index]) { mapObj._children[index].destroy(); }

                var uid = df.uid;
                var viewId = [uid, '-', index].join('');
                mapObj._children[index] = { loading: true, ready: function() { return false; },
                    $dom: $('<div id="' + id + '_' + viewId + '"></div>') };
                Dataset.lookupFromViewId(uid, function(ds)
                {
                    if (df.legacy)
                    {
                        if (!ds.isArcGISDataset() && !ds.isGeoDataset())
                        {
                            df.plotStyle = 'point';
                            var locCol = _.detect(ds.realColumns, function(col)
                                { return col.renderTypeName == 'location'; });
                            if (locCol)
                            { df.plot = { locationId: locCol.tableColumnId }; }
                            df.color = '#0000ff';
                        }
                        delete df.legacy;
                    }

                    mapObj.$dom().append(mapObj._children[index].$dom);
                    var query = $.deepGet(mapObj._primaryView.metadata, 'query', ds.id);
                    mapObj._children[index] = $(mapObj._children[index].$dom)
                            .socrataDataLayer({ view: ds, index: index, query: query,
                                                parentViz: mapObj, displayFormat: df });
                    mapObj._controls.Overview.registerDataLayer(mapObj._children[index], index);
                    if (ds.isGeoDataset()) { mapObj._controls.Overview.open(); }

                    if (mapObj._displayFormat.viewDefinitions.length == mapObj._children.length
                        && _.all(mapObj._children, function(cv) { return !cv.loading; }))
                    { datasetsLoaded(); }
                });
            };

            mapObj._primaryView.bind('displayformat_change', function()
            {
                if ((blist.debug || {}).viewport && (console || {}).trace)
                {
                    console.groupCollapsed('primaryView displayformat_change');
                    console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                    console.groupCollapsed('arguments'); console.log(arguments); console.groupEnd();
                    console.groupCollapsed('old state'); console.dir(mapObj._displayFormat); console.groupEnd();
                    console.groupCollapsed('new state'); console.dir(this.displayFormat); console.groupEnd();
                    console.groupEnd();
                }
                if (arguments.length > 0) { return; }
                if (mapObj._panning) { delete mapObj._panning; return; }
                mapObj._displayFormat = this.displayFormat;

                if (!mapObj._displayFormat.viewDefinitions)
                { Dataset.map.convertToVersion2(mapObj._primaryView, mapObj._displayFormat); }

                if (mapObj._controls.SelectFeature)
                {
                    mapObj._controls.SelectFeature.destroy();
                    delete mapObj._controls.SelectFeature;
                }

                mapObj.initializeBackgroundLayers();

                if (!_.isUndefined(mapObj._displayFormat.distinctLegend))
                { mapObj._displayFormat.distinctLegend ? mapObj._controls.Overview.enableLegend()
                                                       : mapObj._controls.Overview.disableLegend(); }

                var length = mapObj._displayFormat.viewDefinitions.length;
                _.each(mapObj._children.slice(length), function(childView) { childView.destroy(); });
                mapObj._children = mapObj._children.slice(0, length);
                mapObj._controls.Overview.truncate(length);

                _.each(mapObj._children, function(cv) { cv.loading = true; });

                var childViewConstructing = false;
                _.each(mapObj._displayFormat.viewDefinitions, function(df, index)
                {
                    if (mapObj._children[index]
                        && _.isEqual(mapObj._children[index]._displayFormat, df))
                    { delete mapObj._children[index].loading; return; }

                    if (mapObj._children[index] && df.uid == mapObj._children[index]._view.id
                        && df.plotStyle == mapObj._children[index]._displayFormat.plotStyle)
                    {
                        mapObj._children[index]._view.trigger('displayformat_change', [df])
                        delete mapObj._children[index].loading;
                    }
                    else
                    { childViewConstructing = true; constructChildView(df, index); }
                });

                if (mapObj._doneLoading
                    && !_.isEqual(
                        mapObj.viewportHandler().toArray(blist.openLayers.geographicProjection),
                        mapObj._displayFormat.viewport))
                { mapObj.viewportHandler().resetToOriginal(); }

                if (!childViewConstructing)
                {
                    mapObj.buildSelectFeature();
                    if (mapObj._displayFormat.viewDefinitions.length == mapObj._children.length
                        && _.all(mapObj._children, function(cv) { return !cv.loading; }))
                    { datasetsLoaded(); }
                }
            }).trigger('displayformat_change');
        },

        restackDataLayers: function()
        {
            var mapObj = this;

            var index = mapObj.map.backgroundLayers().length;
            var views = _.sortBy(mapObj._children, function(cv) { return cv._index; });
            _.each(views, function(childView)
            {
                _.each(childView.layersToRestack(), function(layer)
                { mapObj.map.setLayerIndex(layer, index++); });
            });
        },

        setLayerIndex: function(childView, index)
        {
            var mapObj = this;

            var views = _.sortBy(mapObj._children, function(cv) { return cv._index; });
            var base = _.indexOf(views, childView);
            if (base != index)
            {
                views.splice(base, 1);
                views.splice(index, 0, childView);
                _.each(views, function(cv, i) { cv._setLayerIndex(i); });
            }
        },

        mapElementLoaded: function(layer)
        {
            var mapObj = this;
            if (layer.object) { layer = layer.object; }
            $.debug('map element loaded', layer.name || layer.id);

            if (blist.openLayers.isBackgroundLayer(layer)) { layer._loaded = true; }

            if (!mapObj._doneLoading
                && _.all(mapObj.map.backgroundLayers(), function(layer) { return layer._loaded; })
                && _.all(mapObj._children, function(cv) { return cv.ready(); }))
            {
                $.debug('map acknowledges being ready');
                mapObj.viewportHandler().expected();
                mapObj.viewportHandler().saveViewport(true);
                mapObj.geolocate();
                // Often, at this point, the images of the tiles themselves are not done loading.
                // Thus, we timeout to wait for this.
                setTimeout(function() {
                    if (mapObj._primaryView.snapshotting)
                    { mapObj._primaryView.takeSnapshot(); }
                }, 2000);

                _.each(mapObj._children, function(cv) { cv.clearTemporary(); });

                mapObj._doneLoading = true;
            }
        },

        initializeBackgroundLayers: function()
        {
            var mapObj = this;
            if ((blist.debug || {}).viewport && (console || {}).trace)
            {
                console.groupCollapsed('initializeBackgroundLayers');
                console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                console.groupCollapsed('config'); console.dir(mapObj._displayFormat.bkgdLayers); console.groupEnd();
                console.groupCollapsed('cache'); console.dir(mapObj._backgroundLayers); console.groupEnd();
                console.groupEnd();
            }

            mapObj.setExclusiveLayers();
            if (!mapObj._backgroundLayers
                || !_.isEqual(mapObj._backgroundLayers, mapObj._displayFormat.bkgdLayers))
            {
                // This is a new set of background layers. Set a forest fire.
                if (mapObj._viewportHandler) { mapObj.viewportHandler().expect(); }
                _.each(mapObj.map.backgroundLayers(), function(layer) { layer.destroy(); });
                mapObj._controls.MapTypeSwitcher.clearMapTypes();
            }
            else
            { return; }

            var bkgdLayers;
            // Ensure there's a base layer to make OpenLayers internals work.
            if (_.isEmpty(mapObj._displayFormat.bkgdLayers))
            {
                bkgdLayers = [{ layerName: 'World Street Map (ESRI)', opacity: 1.0, hidden: true }];
                mapObj.map.setNoBackground(true);
            }
            else
            {
                bkgdLayers = mapObj._displayFormat.bkgdLayers;
                mapObj.map.setNoBackground(false);
            }

            _.each(bkgdLayers, function(layer) { mapObj.addBackgroundLayer(layer); });

            mapObj._backgroundLayers = _.map(mapObj._displayFormat.bkgdLayers, function(o)
                { return $.extend({}, o); });

            this.map.setBaseLayer(this.map.backgroundLayers()[0])
        },

        setExclusiveLayers: function()
        {
            var mapObj = this;

            if (mapObj._controls.Overview.exclusiveLayers == mapObj._displayFormat.exclusiveLayers)
            { return; }

            if (mapObj._displayFormat.exclusiveLayers)
            {
                mapObj._controls.MapTypeSwitcher.activate();
                _.each(mapObj.map.backgroundLayers(), function(layer)
                {
                    mapObj._controls.MapTypeSwitcher.registerMapType(layer.alias, layer);
                    layer.setIsBaseLayer(true);
                });
                mapObj._controls.Overview.exclusiveLayers = true;
            }
            else
            {
                mapObj._controls.MapTypeSwitcher.deactivate();
                mapObj._controls.Overview.exclusiveLayers = false;
                _.each(mapObj.map.backgroundLayers(), function(layer)
                { layer.setIsBaseLayer(layer === mapObj.map.baseLayer); });
            }
            mapObj._controls.Overview.redraw();
        },

        addBackgroundLayer: function(layerOptions)
        {
            var mapObj = this;
            if ((blist.debug || {}).viewport && (console || {}).trace)
            {
                console.groupCollapsed('addBackgroundLayer');
                console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                console.groupCollapsed('arguments'); console.log(arguments); console.groupEnd();
                console.groupCollapsed('layers'); console.dir(mapObj.map.layers); console.groupEnd();
                console.groupEnd();
            }

            var config;

            if (layerOptions.name == 'custom')
            { config = $.extend({}, Dataset.map.backgroundLayer.custom,
                { custom_url: layerOptions.custom_url }); }
            else if (mapObj._displayFormat.overrideWithLayerSet)
            { config = layerOptions; }
            else
            { config = _.detect(Dataset.map.backgroundLayers, function(config)
                { return config.name == layerOptions.layerName; }); }

            var options = config.options;
            if (!$.isBlank($.trim(layerOptions.alias)))
            { config.alias = $.trim(layerOptions.alias); }

            var layer;
            // If you add another type here, also make sure it's registered in
            // blist.openLayers.backgroundLayerTypes.
            switch (config.className)
            {
                case 'Google':
                    options = $.extend(options, { type: google.maps.MapTypeId[options.type] });
                    layer = new OpenLayers.Layer.Google(config.name, options); break;
                case 'Bing':
                    options = $.extend(options, {
                        key: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                        transitionEffect: 'resize'
                    });
                    layer = new OpenLayers.Layer.Bing(options); break;
                case 'ESRI':
                    var url = config.name == 'custom' ? config.custom_url
                                : 'https://server.arcgisonline.com/ArcGIS/rest/services/'
                                + options.url + '/MapServer';
                    var name;
                    if (config.name == 'custom')
                    {
                        var name = url.match(/services\/(.*)\/[A-Za-z]+Server/);
                        if (name) { name = name[1]; }
                    }
                    options = $.extend({}, options, {
                        url: url,
                        projection: 'EPSG:102113',
                        tileSize: new OpenLayers.Size(256, 256),
                        tileOrigin: new OpenLayers.LonLat(-20037508.342787, 20037508.342787),
                        maxExtent: new OpenLayers.Bounds(-20037508.34, -19971868.8804086,
                                                          20037508.34,  19971868.8804086),
                        transitionEffect: 'resize'
                    });
                    layer = new OpenLayers.Layer.ArcGISCache(name || config.name, url, options);
                    break;
            }

            layer.availableZoomLevels = config.zoomLevels || 21;
            layer.alias = config.alias;
            layer.setIsBaseLayer(!mapObj.map.baseLayer || mapObj._displayFormat.exclusiveLayers);

            if (mapObj._displayFormat.exclusiveLayers)
            { mapObj._controls.MapTypeSwitcher.registerMapType(config.alias, layer); }

            var hideLayer;
            if (!mapObj._displayFormat.exclusiveLayers || !mapObj.map.baseLayer
                || layer instanceof OpenLayers.Layer.Google)
            {
                if (mapObj._viewportHandler) { mapObj.viewportHandler().expect(); }
                mapObj.map.addLayer(layer);
                if (layer instanceof OpenLayers.Layer.Google)
                {
                    var timeout, trigger;
                    var listener = google.maps.event.addListener(layer.mapObject, 'tilesloaded',
                        function()
                        {
                            // On initial load, tiles actually load *twice*. The second time happens
                            // when you add data and zoom to the data extent.
                            // If no zooming happens, then the timeout triggers and calls it ready.
                            if (_.isFunction(trigger))
                            { trigger(); clearTimeout(timeout); return; }
                            timeout = setTimeout(trigger = function()
                            {
                                mapObj.mapElementLoaded(layer);
                                google.maps.event.removeListener(listener);
                            }, 2000);
                        });

                    if (mapObj._displayFormat.exclusiveLayers && mapObj.map.baseLayer != layer)
                    { hideLayer = true; }
                }
                else
                { layer.events.register('loadend', mapObj, mapObj.mapElementLoaded); }
            }

            if (layerOptions.opacity) { layer.setOpacity(layerOptions.opacity); }
            if (layerOptions.hidden || hideLayer) { layer.setVisibility(false); }
        },

        saveQuery: function(uid, query)
        {
            if ($.isBlank(query.filterCondition)) { return; }
            var newMD = $.extend(true, {}, this._primaryView.metadata);
            $.deepSet(newMD, query, 'query', uid);
            this._primaryView.update({ metadata: newMD });
        },

        initializeEvents: function()
        {
            var mapObj = this;

            mapObj.map.events.register('zoomend', null, function()
            {
                var zoomLevel = mapObj.map.getZoom();
                _.each(mapObj.map.backgroundLayers(), function(layer)
                {
                    if (zoomLevel >= layer.zoomLevels)
                    { layer.setVisibility(false); layer.hiddenByZoom = true; }
                    else if (layer.hiddenByZoom)
                    { layer.setVisibility(true); delete layer.hiddenByZoom; }
                });
                mapObj._controls.Overview.redraw();
            });

            mapObj.viewportHandler(); // Just in case; no actual reason to initialize here.
            mapObj.buildSelectFeature();
            mapObj.buildGetFeature();

            mapObj.map.getControlsByClass('OpenLayers.Control.Attribution')[0].events
                .register('attributionupdated', null,
                function() { mapObj._controls.Overview.correctHeight(); });

            mapObj.map.events.register('mousemove', mapObj,
                function(evt) { mapObj._lastClickAt = mapObj.map.events.getMousePosition(evt); });
        },

        buildSelectFeature: function()
        {
            var mapObj = this;
            if (mapObj._controls.SelectFeature)
            { return; }

            var featureLayers = _(mapObj._children).chain()
                .map(function(childView) { return childView.selectableFeatureLayers(); })
                .compact()
                .flatten()
                .value();

            mapObj._controls.SelectFeature = new OpenLayers.Control.SelectFeature(featureLayers,
                { 'hover': true, 'callbacks': {
                    'click': function(feature)
                    { feature.layer.dataObj.clickFeature(feature); },
                    'over': function(feature)
                    { feature.layer.dataObj.overFeature(feature); },
                    'out': function(feature)
                    { feature.layer.dataObj.outFeature(feature); }
                }});
            mapObj.map.addControl(mapObj._controls.SelectFeature);
            mapObj._controls.SelectFeature.activate();

            // This is to allow us to drag when (for example) clicking on a polygon.
            // It is probably the best way to do this, short of modifying SelectFeature.
            mapObj._controls.SelectFeature.handlers.feature.stopDown = false;
        },

        buildGetFeature: function()
        {
            var mapObj = this;

            _.each(mapObj._children, function(childView)
            {
                if (childView.buildGetFeature)
                { childView.buildGetFeature(); }
            });
        },

        viewportHandler: function()
        {
            var mapObj = this;
            if (!mapObj._viewportHandler)
            {
                mapObj.map.addControl(mapObj._viewportHandler
                    = new blist.openLayers.Viewport(mapObj, mapObj._displayFormat.viewport));
                mapObj._viewportHandler.viewportInOriginal = !!mapObj._displayFormat.viewport;
            }
            return mapObj._viewportHandler;
        },

        geolocate: function(geolocate)
        {
            // Expected format: { address: '123 Main Street, Seattle, WA', radius: '5mi' }
            if (geolocate || this._displayFormat.geolocate)
            { this._controls.GeocodeDialog.geocode(geolocate || this._displayFormat.geolocate); }
        },

        clearHoverTimer: function(dupKey)
        {
            var mapObj = this;

            if (!mapObj._hoverTimers) { mapObj._hoverTimers = {}; }
            if (!$.isBlank(mapObj._hoverTimers[dupKey]))
            {
                clearTimeout(mapObj._hoverTimers[dupKey]);
                delete mapObj._hoverTimers[dupKey];
            }
        },

        setHoverTimer: function(dupKey, callback)
        {
            var mapObj = this;

            if (!mapObj._hoverTimers) { mapObj._hoverTimers = {}; }
            mapObj._hoverTimers[dupKey] = setTimeout(function()
                {
                    delete mapObj._hoverTimers[dupKey];
                    callback();
                }, 100);
        },

        rowsLoaded: function(num)
        {
            if (_.isUndefined(this._rowsLoaded)) { this._rowsLoaded = 0; }
            this._rowsLoaded += num;
            this.rowRemaining -= num;
        },

        cleanVisualization: function()
        {
            var mapObj = this;

            mapObj._super();
            mapObj.closePopup();
        },

        reloadVisualization: function()
        {
            var mapObj = this;

            if (!mapObj._displayFormat.viewDefinitions)
            { Dataset.map.convertToVersion2(mapObj._primaryView, mapObj._savedDF); }

            mapObj._primaryView.trigger('displayformat_change');

            mapObj._super();
        },

        reload: function(newDF)
        {
            this._super(newDF);
            this.geolocate();
        },

        resizeHandle: function(event)
        {
            var mapObj = this;

            if (mapObj.map) { mapObj.viewportHandler().expect(); }
            if (mapObj._controls && mapObj._controls.ZoomBar) { mapObj._controls.ZoomBar.redraw(); }

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

                    _(mapObj.map.layers).chain()
                        .select(function(layer) { return layer instanceof OpenLayers.Layer.Vector; })
                        .each(function(layer) { fixOffsetLeft(layer); });
                }
            });
        },

        getDataForAllViews: function()
        {
            // Not using this because it gets called unexpectedly by base-vis.
        },

        getDataForChildren: function()
        {
            var mapObj = this;

            if (!mapObj.isValid()) { return; }
            if (_.any(mapObj._children, function(childView) { return childView.loading; }))
            { return; }

            _.each(mapObj._children, function(childView) { childView.getData(); });
        },

        initializeAnimation: function(data, view)
        {
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
                { _.isFunction(viewConfig._displayLayer.removeFeatures) &&
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
                                .transform(blist.openLayers.geographicProjection, mapObj.map.getProjectionObject());

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

            if (mapObj._displayFormat.disableFlyouts) { return; }
            options = options || {};

            if (!options.keepOpen) { mapObj.closePopup(null, true); }

            if (!lonlat)
            { lonlat = mapObj.map.getLonLatFromViewPortPx(mapObj._lastClickAt); }

            var popup = new OpenLayers.Popup.FramedCloud(null,
                lonlat, null, contents, null, true,
                function(evt) { new jQuery.Event(evt).stopPropagation(); mapObj.closePopup(); });
            popup.onClosePopup = options.closeBoxCallback;
            popup.closeKey = options.closeKey;
            popup.panMapIfOutOfView = !mapObj.map._extentRestricted;
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
                    var href = $a.attr('href').split('/');
                    $(document).trigger(blist.events.DISPLAY_ROW,
                        [href.slice(href.length - 2).join('/')]);
                });

        },

        closePopup: function(closeKey, force)
        {
            var mapObj = this;

            if (mapObj._displayFormat.disableFlyouts) { return; }
            if (!mapObj._popup) { return; }
            if (!force && mapObj._popup.closeKey != closeKey)
            { return; }

            if (_.isFunction(mapObj._popup.onClosePopup))
            { mapObj._popup.onClosePopup(); }

            mapObj._popup.destroy();
            mapObj._popup = null;
        }
    }, {
        defaultZoom: 1,
        coordinatePrecision: 6,
        iconScaleFactor: 1.2
    }, 'socrataVisualization');

})(jQuery);
