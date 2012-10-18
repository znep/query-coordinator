(function($)
{
    var geographicProjection = new OpenLayers.Projection('EPSG:4326');

    $.Control.registerMixin('heatmap', {
        initializeLayer: function()
        {
            var layerObj = this;

            layerObj._displayLayer = new OpenLayers.Layer.Heatmap(layerObj._view.name,
                layerObj._map,
                { 'element': layerObj._parent.currentDom, 'radius': 25, 'visible': true });
            layerObj._map.addLayer(layerObj._displayLayer);

            layerObj._dataStore = [];
            layerObj._bounds = null;

            layerObj._parent.viewportHandler()
                .events.register('viewportchanged', layerObj, layerObj.onViewportChange);
        },

        initializeFlyouts: function(){}, // No flyouts

        destroy: function()
        {
            this._displayLayer.destroy();
            delete this._dataStore;
            delete this._bounds;
            delete this._idList;
            this._parent.viewportHandler().events
                .unregister('viewportchanged', this, this.onViewportChange);
        },

        preferredExtent: function()
        {
            return this._bounds;
        },

        clearData: function()
        {
            this._bounds = new OpenLayers.Bounds();
            this._dataStore = [];
            this._idList = {};
        },

        handleDataLoaded: function()
        {
            this._super.apply(this, arguments);

            this._displayLayer.setDataSet({ max: 50, data: this._dataStore });
        },

        prepareRowRender: function(row_or_cluster)
        {
            var layerObj = this;

            if (!layerObj._idList) { layerObj._idList = {}; }

            if (layerObj._renderType == 'clusters')
            { layerObj.prepareHeatAsCluster(row_or_cluster); }
            else
            { layerObj.prepareHeatAsRow(row_or_cluster); }
        },

        extendBounds: function(lonlat)
        {
            if (!this._bounds) { this._bounds = lonlat.toGeometry().getBounds(); }
            else { this._bounds.extend(lonlat); }
        },

        prepareHeatAsCluster: function(cluster)
        {
            var layerObj = this;

            if (layerObj._idList['cluster' + cluster.id]) { return; }

            // A cluster should either have children or points.
            if (!_.isEmpty(cluster.points))
            {
                _.each(cluster.points, function(child)
                {
                    var lonlat = new OpenLayers.LonLat(child.lon, child.lat)
                        .transform(blist.openLayers.geographicProjection, layerObj._mapProjection);
                    layerObj._dataStore.push({ lonlat: lonlat });
                    layerObj.extendBounds(lonlat);
                });
            }
            else if (!_.isEmpty(cluster.children))
            {
                _.each(cluster.children, function(child)
                {
                    var lonlat = new OpenLayers.LonLat(child.centroid.lon, child.centroid.lat)
                        .transform(blist.openLayers.geographicProjection,
                                   layerObj._mapProjection);
                    layerObj._dataStore.push({ lonlat: lonlat, count: child.size });
                    layerObj.extendBounds(lonlat);
                });
            }

            layerObj._idList['cluster' + cluster.id] = true;
        },

        prepareHeatAsRow: function(row)
        {
            var layerObj = this;

            var geometry = layerObj.extractGeometryFromRow(row);
            if (_.isBoolean(geometry) || _.isString(geometry)) { return null; }

            var dupKey = geometry.toString();

            if (layerObj._idList[dupKey]) { return; }

            var lonlat = geometry.toLonLat();
            layerObj._dataStore.push({ lonlat: lonlat });
            layerObj.extendBounds(lonlat);

            layerObj._idList[dupKey] = true;
        },

        renderDatum: function(datum)
        {
            // Pft. Rendering.
        }
    }, {}, 'socrataDataLayer', 'clusters');

    $.Control.registerMixin('rastermap', {
        initializeMap: function()
        {
            this._super();
            this.$dom().siblings('.mapLayers').hide();

            if ($.browser.msie && parseInt($.browser.version) < 9)
            {
                alert("Raster Heat Maps do not work in your current browser. Please "
                    + "upgrade to IE9, use Google Chrome or Mozilla Firefox. Thank you.");
                return;
            }
        },

        initializeEvents: function()
        {
            var mapObj = this;

            mapObj.map.events.register('moveend', mapObj.map, function()
            {
                if (mapObj._initialLoad) { return; }
                if (mapObj._boundsChanging)
                { delete mapObj._boundsChanging; delete mapObj._isResize; return; }

                mapObj.updateDatasetViewport(mapObj._isResize);
                mapObj.updateRowsByViewport();
                delete mapObj._isResize;
            });
        },

        buildViewLayer: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];
            var layer = viewConfig._heatmapLayer
                = new OpenLayers.Layer.Heatmap('Heatmap', mapObj.map,
                    { "element":mapObj.currentDom, "radius":25, "visible":true });
            viewConfig._dataStore = [];
            viewConfig._bounds = new OpenLayers.Bounds();

            // For snapshotting.
            viewConfig._renderedRows = 0;

            view.bind('query_change',
                function() { viewConfig._idList = {}; viewConfig._dataStore = []; }, mapObj);
            
            return layer;
        },

        renderGeometry: function(geoType, geometry, dupKey, details)
        {
            var mapObj = this;
            if (geoType != 'point') { return; }
            var viewConfig = mapObj._byView[details.dataView.id];
            viewConfig._renderedRows++;

            if (viewConfig._idList && viewConfig._idList[dupKey])
            { return true; }
            if (!viewConfig._idList) { viewConfig._idList = {}; }
            viewConfig._idList[dupKey] = true;

            viewConfig._rowsChanged = true;
            var lonlat = new OpenLayers.LonLat(geometry.longitude, geometry.latitude).transform(
                geographicProjection, mapObj.map.getProjectionObject());
            viewConfig._dataStore.push({ lonlat: lonlat });
            viewConfig._bounds.extend(lonlat);

            return true;
        },

        renderCluster: function(cluster, details)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[details.dataView.id];

            var bounds = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(
                    _.map(cluster.polygon, function(vertex)
                    { return new OpenLayers.Geometry.Point(vertex.lon, vertex.lat); }))])
                .transform(geographicProjection, mapObj.map.getProjectionObject()).getBounds();

            var scatterShot;
            if (cluster.size < 20)
            { scatterShot = 1; }
            else if (cluster.size <= 100)
            { scatterShot = 20 + Math.floor(0.3 * cluster.size); }
            else if (cluster.size <= 1000)
            { scatterShot = 50 + Math.floor(0.01 * cluster.size); }
            else
            { scatterShot = 60 + Math.floor((Math.log(cluster.size)
                                     /Math.log(10) - 4) * 10); }

            var strength = Math.floor(cluster.size / scatterShot);
            var width = bounds.getWidth();
            var height = bounds.getHeight();
            var maxExtent = mapObj.map.getMaxExtent();

            _(scatterShot).times(function()
            {
                var lon = bounds.left + (Math.random() * width) - (width / 2);
                var lat = bounds.top  + (Math.random() * height) - (height / 2);
                if (lon < maxExtent.left) { lon = maxExtent.left; }
                else if (lon > maxExtent.right) { lon = maxExtent.right; }
                if (lat > maxExtent.top) { lat = maxExtent.top; }
                else if (lat > maxExtent.bottom) { lat = maxExtent.bottom; }

                var lonlat = new OpenLayers.LonLat(lon, lat);
                viewConfig._dataStore.push({ lonlat: lonlat });
                viewConfig._bounds.extend(lonlat);
            });

            viewConfig._rowsChanged = true;
            return true;
        },

        rowsRendered: function()
        {
            var mapObj = this;
            mapObj._super();

            _.each(mapObj._byView, function(viewConfig)
            {
                if (viewConfig._rowsChanged)
                { viewConfig._heatmapLayer.setDataSet({ max: 50, data: viewConfig._dataStore }); }
                viewConfig._rowsChanged = false;

                if (viewConfig._renderType == 'clusters')
                { mapObj.mapElementLoaded(); }
                else
                {
                    if (viewConfig._renderedRows >= viewConfig.view.totalRows()
                        || viewConfig._renderedRows >= viewConfig._requestedRows)
                    { mapObj.mapElementLoaded(); }
                }
            });
        },

        adjustBounds: function()
        {
            var mapObj = this;
            if ($.subKeyDefined(mapObj, '_primaryView.query.namedFilters.viewport'))
            { return; }

            mapObj._boundsChanging = true;
            if (mapObj._displayFormat.viewport)
            { mapObj.setViewport(mapObj._displayFormat.viewport); }
            else
            {
                var bounds = _.reduce(mapObj._byView, function(memo, viewConfig)
                    { memo.extend(viewConfig._bounds); return memo; },
                    new OpenLayers.Bounds());
                mapObj.map.zoomToExtent(bounds);
            }
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            if (mapObj._requireRowReload && !mapObj._byView[mapObj._primaryView.id]._viewportChanged)
            { delete mapObj._neverCluster; }

            if (mapObj._baseLayers)
            { _.each(mapObj._baseLayers, function(layer) { layer.destroy(false); }); }

            _.each(mapObj._byView, function(viewConfig)
            {
                viewConfig._bounds = new OpenLayers.Bounds();
                viewConfig._dataStore = [];
                viewConfig._heatmapLayer.deactivate();
            });
        },

        reloadVisualization: function()
        {
            var mapObj = this;

            mapObj._super();

            _.each(mapObj._byView, function(viewConfig)
            {
                viewConfig._heatmapLayer.mapLayer = mapObj.map.baseLayer;
                viewConfig._heatmapLayer.activate();
            });
        }
    }, null, 'socrataMap');
})(jQuery);
