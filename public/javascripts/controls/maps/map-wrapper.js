(function($)
{
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    blist.namespace.fetch('blist.openLayers');

    var settingsWhitelist = [ 'showRowLink', 'hideRowLink', 'basePointSize',
                              'numSegments', 'clusterThreshold', 'staleClusters',
                              'defaultPixelSize', 'externalizeRowLink' ];

    $.Control.extend('socrataMap', {
        isValid: function()
        {
            return Dataset.map.isValid(this._primaryView, this._displayFormat);
        },

        getRequiredJavascripts: function()
        {
            return { url: 'https://maps.google.com/maps/api/js?sensor=true&libraries=geometry',
                jsonp: 'callback' };
        },

        initializeVisualization: function()
        {
            var mapObj = this;

            // Bug CORE-1145: _edit_mode=true causes an attempt to
            // render on a hidden, dimensionless DIV. This breaks everything.
            if (mapObj.$dom().parents(':not(:visible)').exists())
            {
                mapObj._reinitializeOnResize = true;
                return;
            }

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
            if (mapObj.settings.interactToScroll)
            { mapOptions.interactToScroll = true; }

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
            mapObj._controls.Navigation = mapObj.map.getControlsByClass('OpenLayers.Control.Navigation')[0];

            mapObj._controls.Overview.events.on({
                'datalayer_hover_over': mapObj.onHoverDataLayer,
                'datalayer_hover_out':  mapObj.onHoverDataLayer,
                scope: mapObj
            });

            if (mapObj.settings.interactToScroll && $.subKeyDefined(mapObj, '_controls.Navigation'))
            {
                $(mapObj.currentDom).one('mouseup', function(e)
                { mapObj._controls.Navigation.enableZoomWheel(); });
            }

            if (mapObj._displayFormat.disableGeolocator)
            { mapObj._controls.GeocodeDialog.deactivate(); }

            mapObj.map.events.register('preaddlayer', mapObj, function(evtObj) {
                if (mapObj._viewportHandler && blist.openLayers.isBackgroundLayer(evtObj.layer))
                { mapObj._viewportHandler.expect('preaddlayer event'); }
            });

            mapObj._children = [];

            var handleDisplayFormatChange = function()
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
                mapObj.updateDisplayFormat(this.displayFormat);
            };

            if (mapObj._primaryView)
            {
                mapObj._primaryView.bind('displayformat_change', handleDisplayFormatChange)
                                   .trigger('displayformat_change');
                mapObj._primaryView.bind('query_change', function()
                { mapObj.updateSearchString(); });
            }
            else if (!$.isBlank(mapObj.settings.displayFormat)) // context + df.vd case.
            { mapObj.updateDisplayFormat(mapObj.settings.displayFormat); }
            else if ($.subKeyDefined(mapObj, '_displayFormat.bkgdLayers')) // Canvas from scratch
            { mapObj.initializeBackgroundLayers(); }
        },

        updateDisplayFormat: function(df)
        {
            var mapObj = this;
            if ($.isBlank(mapObj.map)) { mapObj._displayFormat = df; return; } // Ensure validity.

            if (mapObj._initialMapLoad === true)
            { return; }
            if (_.isUndefined(mapObj._initialMapLoad))
            { mapObj._initialMapLoad = true; }

            mapObj.closePopup();
            if (mapObj._panning) { delete mapObj._panning; return; }
            mapObj._displayFormat = df;
            if ($.isEmptyObject(mapObj._displayFormat))
            { return; }

            if (_.isUndefined(mapObj.layerSettings))
            { mapObj.layerSettings = _.pick(mapObj.settings, settingsWhitelist); }

            if (!mapObj._displayFormat.viewDefinitions)
            { Dataset.map.convertToVersion2(mapObj._primaryView, mapObj._displayFormat); }

            if (mapObj._controls.SelectFeature)
            {
                mapObj._controls.SelectFeature.destroy();
                delete mapObj._controls.SelectFeature;
            }

            mapObj.initializeBackgroundLayers();
            mapObj._controls.Overview.reposition(
                $.deepGet(mapObj._displayFormat, 'legendDetails', 'position') || 'none');
            if ($.subKeyDefined(mapObj._displayFormat, 'legendDetails.showConditional'))
            { mapObj._controls.Overview.configure('describeCF',
                mapObj._displayFormat.legendDetails.showConditional); }
            if ($.subKeyDefined(mapObj._displayFormat, 'legendDetails.customEntries'))
            { mapObj._controls.Overview.configure('customEntries',
                mapObj._displayFormat.legendDetails.customEntries); }

            if (mapObj._displayFormat.disableGeolocator)
            { mapObj._controls.GeocodeDialog.deactivate(); }
            else
            { mapObj._controls.GeocodeDialog.activate(); }

            var length = (mapObj._displayFormat.viewDefinitions || []).length;
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

                if (mapObj._children[index]
                    && ($.subKeyDefined(df, 'context.dataset')
                        || df.uid == mapObj._children[index]._view.id
                        || df.uid == 'self' && mapObj._children[index]._view.id == mapObj._primaryView.id)
                    && df.plotStyle == (mapObj._children[index]._displayFormat || {}).plotStyle)
                {
                    mapObj._children[index]._view.trigger('displayformat_change', [df])
                    delete mapObj._children[index].loading;
                }
                else
                { childViewConstructing = true; mapObj._constructDataLayer(df, index); }
            });

            if (mapObj._doneLoading
                && !_.isEqual(
                    mapObj.viewportHandler().toArray(blist.openLayers.geographicProjection),
                    mapObj._displayFormat.viewport))
            { mapObj.viewportHandler().resetToOriginal(); }

            if (!childViewConstructing)
            {
                mapObj.buildSelectFeature();
                if ((mapObj._displayFormat.viewDefinitions || []).length == mapObj._children.length
                    && _.all(mapObj._children, function(cv) { return !cv.loading; }))
                {
                    mapObj._onDatasetsLoaded();
                    mapObj.geolocate();
                }
            }
        },

        _constructDataLayer: function(displayFormat, index)
        {
            var mapObj = this;

            if (mapObj._children[index]) { mapObj._children[index].destroy(); }

            var id = mapObj.$dom().attr('id'),
                df = displayFormat,
                uid = df.uid,
                viewId = [uid, '-', index].join('');

            mapObj._children[index] = { loading: true, ready: function() { return false; },
                $dom: $('<div id="' + id + '_' + viewId + '"></div>') };
            var loadDataset = function(ds)
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
                var query = $.deepGet(mapObj, '_primaryView', 'metadata', 'query', ds.id);
                try {
                    mapObj._children[index] = $(mapObj._children[index].$dom)
                            .socrataDataLayer($.extend({}, mapObj.layerSettings,
                                              { view: ds, index: index, query: query,
                                                parentViz: mapObj, displayFormat: df }));
                    mapObj._children[index].setFullQuery(mapObj._children[index]._query);
                    mapObj._controls.Overview.registerDataLayer(mapObj._children[index], index);
                } catch(e) {
                    mapObj._children[index] = { invalid: true, error: (e || {}).message };
                    mapObj._invalidChildren = $.makeArray(mapObj._invalidChildren);
                    mapObj._invalidChildren.push(mapObj._children[index]);
                }

                if (mapObj._displayFormat.viewDefinitions.length == mapObj._children.length
                    && _.all(mapObj._children, function(cv) { return !cv.loading; }))
                { mapObj._onDatasetsLoaded(); }
            };

            if ($.subKeyDefined(df, 'context.dataset'))
            { loadDataset(df.context.dataset); }
            else if (uid == 'self')
            { loadDataset(mapObj._primaryView); }
            else
            {
                Dataset.lookupFromViewId(uid, loadDataset, function(errorObj)
                {
                    mapObj._children[index] = { invalid: true,
                        error: JSON.parse(errorObj.responseText) };
                    mapObj._invalidChildren = $.makeArray(mapObj._invalidChildren);
                    mapObj._invalidChildren.push(mapObj._children[index]);

                    if (mapObj._displayFormat.viewDefinitions.length == mapObj._children.length
                        && _.all(mapObj._children, function(cv) { return !cv.loading; }))
                    { mapObj._onDatasetsLoaded(); }
                });
            }
        },

        _onDatasetsLoaded: function()
        {
            var mapObj = this;
            mapObj._children = _.reject(mapObj._children, function(cv) { return cv.invalid; });

            // TODO: Decide whether or not this is a good idea.
            if (_.isEmpty(mapObj._children))
            { mapObj.map.setCenter(new OpenLayers.LonLat(0,0)); }
            else if (mapObj.viewportHandler().viewportInOriginal)
            { mapObj.viewportHandler().resetToOriginal(); }

            if (_.any(mapObj._invalidChildren,
                function(cv) { return _.isString(cv.error) && cv.error.indexOf('heat map') > -1; }))
            { alert($.t('controls.map.heatmap_ie8_warning')); }

            // For split views.
            if (mapObj._primaryView)
            { mapObj._primaryView.childViews = _(mapObj._children).chain().map(function(c)
            {
                if (c._view.childViews) { return c._view.childViews; }
                else { return c._view.id; }
            }).flatten().uniq().value(); }

            _.each(mapObj._children, function(childView)
            { childView.bindDatasetEvents(); });

            if (mapObj._primaryView)
            {
                mapObj._primaryView.bind('reloaded', function() {
                    mapObj.flyoutHandler().close();
                    var reInitCondFmt = function(subview)
                    {
                        var condFmt = $.deepGet(mapObj._primaryView.metadata,
                            'conditionalFormatting', subview.id);
                        if (condFmt)
                        {
                            condFmt = $.union( condFmt,
                                (subview.metadata.conditionalFormatting || []));
                            _.each(subview._availableRowSets,
                                function(rs) { rs.formattingChanged(condFmt); });
                        }
                    };
                    _(mapObj._children).chain()
                        .pluck('_view').uniq().without(mapObj._primaryView).each(function(subview)
                    {
                        delete subview.metadata.conditionalFormatting;
                        subview.reload(false, function() { reInitCondFmt(subview); });
                    });
                    _.invoke(mapObj._children, 'getData');
                });
            }

            mapObj.restackDataLayers();

            mapObj.initializeEvents();

            if (mapObj._primaryView)
            { mapObj.updateSearchString(); }

            mapObj.getDataForChildren();

            if (mapObj._primaryView)
            { mapObj._primaryView.trigger('row_count_change'); } // DEBUG EZMODE Sidebar ready.

            mapObj.viewportHandler().events.register('viewportchanged', null,
                function() { mapObj._panning = true; });
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

        onHoverDataLayer: function(evtObj)
        {
            _.each(this._children, function(child)
            { child.toggleDataLayerDimming(evtObj.type == 'datalayer_hover_over', evtObj.layer); });
        },

        mapElementLoaded: function(layer)
        {
            var mapObj = this;
            if (layer.object) { layer = layer.object; }

            if (blist.openLayers.isBackgroundLayer(layer)) { layer._loaded = true; }

            if (!mapObj._doneLoading
                && (mapObj.map.hasNoBackground
                    || _(mapObj.map.backgroundLayers()).chain().pluck('_loaded').all().value())
                && _(mapObj._children).chain().invoke('ready').all().value())
            {
                mapObj._controls.Overview.redraw();
                mapObj.viewportHandler().stopExpecting();
                mapObj.viewportHandler().saveViewport(true);
                mapObj.geolocate();
                // Often, at this point, the images of the tiles themselves are not done loading.
                // Thus, we timeout to wait for this.
                setTimeout(function() {
                    if ((mapObj._primaryView || {}).snapshotting)
                    { mapObj._primaryView.takeSnapshot(); }
                }, 2000);

                // taken out for now. seems we just attempt to do this for sanitycheck/cleanliness
                // but it causes race conditions if temporaryness applies before maploaded is called.
                //_.each(mapObj._children, function(cv) { cv.clearTemporary(); });

                mapObj._initialMapLoad = false;
                mapObj._doneLoading = true;
                $.metrics.measure('domain-intern',
                    'js-map-' + (mapObj._children.length == 1 ? 'one' : 'many') + '-page-load-time');
                if (blist.mainSpinner)
                { blist.mainSpinner.setMetric(null); }
            }
        },

        initializeBackgroundLayers: function()
        {
            var mapObj = this;

            if (blist.feature_flags.stamen !== false)
            {
                mapObj._backgroundLayers = [new blist.openLayers.Stamen(null, { stamenType: blist.feature_flags.stamen })];
                mapObj.map.addLayer(mapObj._backgroundLayers[0]);
                mapObj.map.setBaseLayer(mapObj.map.backgroundLayers()[0]);
                return;
            }

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
                if (mapObj._viewportHandler)
                { mapObj.viewportHandler().expect('initializeBackgroundLayers'); }
                _.each(mapObj.map.backgroundLayers(), function(layer) { layer.destroy(); });
                mapObj._controls.MapTypeSwitcher.clearMapTypes();
            }
            else
            { return; }

            var bkgdLayers;
            // Ensure there's a base layer to make OpenLayers internals work.
            if (_.isEmpty(mapObj._displayFormat.bkgdLayers))
            {
                bkgdLayers = [{ layerKey: 'World Street Map (ESRI)', opacity: 1.0, hidden: true }];
                mapObj.map.setNoBackground(true);
            }
            else
            {
                bkgdLayers = mapObj._displayFormat.bkgdLayers;
                mapObj.map.setNoBackground(_.all(_.pluck(bkgdLayers, 'hidden'), _.identity));
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

            // Legacy support
            if ($.isBlank(layerOptions.layerKey) && !$.isBlank(layerOptions.layerName))
            { layerOptions.layerKey = layerOptions.layerName; }

            if (layerOptions.custom_url)
            { config = $.extend({}, Dataset.map.backgroundLayer.custom,
                { custom_url: layerOptions.custom_url }); }
            else if (mapObj._displayFormat.overrideWithLayerSet)
            { config = layerOptions; }
            else
            { config = _.detect(Dataset.map.backgroundLayers, function(config)
                { return config.key == layerOptions.layerKey; }); }

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
                    layer = new OpenLayers.Layer.Google(config.key, options); break;
                case 'Bing':
                    options = $.extend(options, {
                        key: 'ApOZ5wmDJp3UOXVryHpTocVSrsAbi-7FC-JQznJC4ZdAhgG5H7nnyr27wPNxzChd',
                        transitionEffect: 'resize'
                    });
                    layer = new OpenLayers.Layer.Bing(options); break;
                case 'ESRI':
                    var url = config.key == 'custom' ? config.custom_url
                                : 'https://server.arcgisonline.com/ArcGIS/rest/services/'
                                + options.url + '/MapServer';
                    var name;
                    if (config.key == 'custom')
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
                    layer = new OpenLayers.Layer.ArcGISCache(name || config.key, url, options);
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
                if (mapObj._viewportHandler)
                { mapObj.viewportHandler().expect('adding background layer'); }
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
            if ((blist.debug || {}).events && (console || {}).trace)
            {
                console.groupCollapsed('saveQuery');
                    console.groupCollapsed('arguments'); console.dir(arguments); console.groupEnd();
                    console.groupCollapsed('trace'); console.trace(); console.groupEnd();
                console.groupEnd();
            }
            if ($.isBlank(this._primaryView) || uid == 'self' || this._primaryView.id == uid)
            { return; }
            if ($.isBlank(query.filterCondition)) { return; }
            var newMD = $.extend(true, {}, this._primaryView.metadata);
            $.deepSet(newMD, query, 'query', uid);
            this._primaryView.update({ metadata: newMD });
            if ((blist.debug || {}).events && (console || {}).trace)
            {
                console.groupCollapsed('saveQuery (after)');
                    console.groupCollapsed('_primaryView'); console.dir(this._primaryView.metadata); console.groupEnd();
                    console.groupCollapsed('blist.dataset'); console.dir(blist.dataset.metadata); console.groupEnd();
                console.groupEnd();
            }
        },

        updateSearchString: function()
        {
            var mapObj = this;

            var searchString = mapObj._primaryView.searchString;
            _(mapObj._children).chain().pluck('_view').without(mapObj._primaryView)
                .each(function(view) { view.update({ searchString: searchString }); });
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
            mapObj.flyoutHandler().close();

            if (blist.mainSpinner)
            { blist.mainSpinner.setMetric('main'); }
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
            if (mapObj._reinitializeOnResize)
            {
                delete mapObj._reinitializeOnResize;
                mapObj.initializeVisualization();
                return;
            }

            if (mapObj.map) { mapObj.viewportHandler().expect('resizeHandle'); }
            if (mapObj._controls && mapObj._controls.ZoomBar) { mapObj._controls.ZoomBar.redraw(); }

            _.defer(function(){
                if (mapObj.map)
                {
                    mapObj.viewportHandler().expect('about to updateSize');
                    mapObj.map.updateSize();
                }

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

        flyoutHandler: function()
        {
            var mapObj = this;
            if (!mapObj._flyoutHandler)
            { mapObj.map.addControl(mapObj._flyoutHandler = new blist.openLayers.Flyout(mapObj)); }
            return mapObj._flyoutHandler;
        },

        showPopup: function(lonlat, contents, options)
        {
            var mapObj = this;

            if (mapObj._displayFormat.disableFlyouts) { return; }
            options = options || {};

            if (options.onlyIf && mapObj._popup && mapObj._popup.closeKey != options.onlyIf)
            { return; }

            if (!options.keepOpen) { mapObj.closePopup(null, true); }

            if (!lonlat)
            { lonlat = mapObj.map.getLonLatFromViewPortPx(mapObj._lastClickAt); }

            var popup = new OpenLayers.Popup.FramedCloud(null,
                lonlat, null, contents, null, true,
                function(evt) { new jQuery.Event(evt).stopPropagation(); mapObj.closePopup(); });
            popup.onClosePopup = options.closeBoxCallback;
            popup.closeKey = options.closeKey;
            popup.panMapIfOutOfView = false;
            mapObj._popup = popup;
            mapObj.map.addPopup(popup);

            // Hack for Bug 9280.
            if (options.atPixel)
            { popup.moveTo(new OpenLayers.Pixel(options.atPixel.x, options.atPixel.y)); }

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
