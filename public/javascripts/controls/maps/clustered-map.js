(function($)
{
    $.Control.registerMixin('clusters', {
        initializeLayer: function()
        {
            var layerObj = this;

            layerObj._super();
            layerObj._clusterBoundaries
                = new OpenLayers.Layer.Vector(layerObj._view.name + ' cluster boundaries');
            layerObj._map.addLayer(layerObj._clusterBoundaries);

            layerObj._parent.viewportHandler()
                .events.register('viewportchanged', layerObj, layerObj.onViewportChange);
        },

        destroy: function()
        {
            this._super();
            this._clusterBoundaries.destroy();
            this._parent.viewportHandler()
                .events.unregister('viewportchanged', this, this.onViewportChange);
        },

        onViewportChange: function()
        {
            var layerObj = this;
            if (layerObj._parent.viewportHandler().viewportInOriginal)
            { delete layerObj._neverCluster; }
            _.defer(function() { layerObj.getData(); });
        },

        layersToRestack: function()
        {
            return this._super().unshift(this._clusterBoundaries);
        },

        clickFeature: function(feature)
        {
            if (this._renderType == 'points') { return this._super(feature); }

            this._clusterBoundaries.removeAllFeatures();
            var currentZoom = this._map.getZoom();
            if (currentZoom < this._map.getZoomForExtent(feature.attributes.bbox))
            { this._map.zoomToExtent(feature.attributes.bbox); }
            else
            { this._map.setCenter(feature.geometry.getBounds().getCenterLonLat(), currentZoom + 1); }
        },

        overFeature: function(feature)
        {
            if (this._renderType == 'points') { return this._super(feature); }
            this._clusterBoundaries.addFeatures(feature.boundary());
        },

        outFeature: function(feature)
        {
            if (this._renderType == 'points') { return this._super(feature); }
            this._clusterBoundaries.removeAllFeatures();
        },

        getData: function()
        {
            var layerObj = this;

            if (layerObj._neverCluster || layerObj._fetchPoints)
            { layerObj._super(); return; }

            var viewport = layerObj._guessedViewport || layerObj._parent.viewportHandler()
                .toViewport(blist.openLayers.geographicProjection);

            layerObj._view.getClusters(viewport,
                { plot: { locationId: (layerObj._locCol || layerObj._geoCol).tableColumnId }},
                layerObj.getMinDistanceForViewportPixels(viewport),
                function(data)
            {
                if (layerObj._neverCluster
                    || _.reduce(data, function(memo, cluster) { return memo + cluster.size; }, 0)
                        < layerObj._parent._maxRows / 2)
                { layerObj.fetchPoints(); return; }

                // A mere single cluster is essentially useless.
                // Make an attempt to break it into its children.
                if (!this._guessedViewport
                    && data.length == 1 && data[0].children.length > 0
                    && layerObj._parent.viewportHandler().isWholeWorld())
                { layerObj.attemptViewportGuess(data[0]); return; }

                layerObj._renderType = 'clusters';

                _.defer(function() {
                    layerObj.handleDataLoaded(data);
                    layerObj._loaded = true;
                    layerObj._parent.mapElementLoaded(layerObj._displayLayer);
                });
            },
            function(errObj)
            {
                if (errObj && errObj.cancelled)
                { layerObj.getData(); } // TODO: Add exponential delay from base-vis.
            });
        },

        fetchPoints: function()
        {
            this._fetchPoints = true;
            this._renderType = 'points';
            this.filterWithViewport();
            delete this._fetchPoints;
        },

        attemptViewportGuess: function(cluster)
        {
            this._guessedViewport = { xmin: cluster.box.lon1, ymin: cluster.box.lat1,
                                      xmax: cluster.box.lon2, ymax: cluster.box.lat2 };
            this.getData();
            delete this._guessedViewport;
        },

        filterWithViewport: function()
        {
            var query = $.extend(true, {}, this._query);

            if ((query.namedFilters || {}).viewport)
            { delete query.namedFilters.viewport; }
            query.namedFilters = $.extend(true, query.namedFilters || {},
                { viewport: this._parent.viewportHandler().toQuery(
                    blist.openLayers.geographicProjection, this._locCol.id) });

            this.setQuery(query, true);
        },

        handleRowChange: function(rows)
        {
            // It doesn't make sense to listen to row changes when we're clustering.
            if (this._renderType == 'points') { this._super.apply(this, arguments); }
        },

        handleDataLoaded: function(data)
        {
            if (_.any([this._lastRenderType, this._renderType],
                function(rt) { return rt == 'clusters'; }))
            { this.clearData(); }

            if (_.isUndefined(this._neverCluster))
            {
                if (this._renderType == 'points')
                {
                    var totalRows = this._view.totalRows();
                    if (totalRows)
                    { this._neverCluster = totalRows < this._parent._maxRows; }
                }
                else
                { this._neverCluster = false; }
            }

            if (_.isEmpty(data)
                || (this._renderType == 'clusters' && _.first(data).centroid)
                || (this._renderType == 'points' && !_.first(data).centroid))
            { this._super(data); }

            this._lastRenderType = this._renderType;
        },

        prepareRowRender: function(cluster)
        {
            var layerObj = this;
            if (layerObj._renderType == 'points') { return layerObj._super(cluster); }

            var geometry = new OpenLayers.LonLat(cluster.centroid.lon, cluster.centroid.lat)
                .transform(blist.openLayers.geographicProjection, layerObj._mapProjection)
                .toGeometry();
            var dupKey = 'cluster' + cluster.id;
            var size = cluster.size;

            var bbox = new OpenLayers.Bounds(cluster.box.lon1, cluster.box.lat1,
                                             cluster.box.lon2, cluster.box.lat2)
                        .transform(blist.openLayers.geographicProjection, layerObj._mapProjection);

            cluster.bbox = bbox;
            cluster.mapProjection = layerObj._map.getProjectionObject();

            return { geometry: geometry, dupKey: dupKey, cluster_data: cluster };
        },

        renderDatum: function(datum)
        {
            var layerObj = this;
            if (layerObj._renderType == 'points') { return layerObj._super(datum); }
            if (!layerObj._data) { layerObj._data = {}; }

            var marker = new blist.openLayers.Cluster(datum.geometry, datum.cluster_data);

            layerObj._data[datum.dupKey] = marker;
            layerObj._displayLayer.addFeatures([marker]);
        },

        getMinDistanceForViewportPixels: function(viewport, pixels)
        {
            if (!pixels) { pixels = this.settings.defaultPixelSize; }

            // Maximum number of divisions that can be made of the pixelspace available.
            var numDivisions = Math.min(this._parent.$dom().height(),
                                        this._parent.$dom().width()) / pixels;

            // Divide the viewport using the max number of divisions.
            return Math.min(viewport.xmax - viewport.xmin,
                            viewport.ymax - viewport.ymin) / numDivisions;
        },

        setQuery: function(query, viewportChange)
        {
            if (!viewportChange) { delete this._neverCluster; }
            this._super.call(this, query);
        }
    }, {
        defaultPixelSize: 45 // Size of a medium cluster, to minimize cluster overlap.
    }, 'socrataDataLayer', 'points');

    // Should inherit from clusters.
    $.Control.registerMixin('animatable', {
        initializeLayer: function()
        {
            var currentObj = this;

            currentObj._super();
            currentObj._animation = { initialLoad: true, panning: false, direction: null };
            $.extend(currentObj._animation, { renderAfter: [], renderAtOtherNode: [] });
        },

        handleDataLoaded: function(data)
        {
            var currentObj = this;

            if (currentObj._animation.initialLoad)
            {
                currentObj._animation.initialLoad = false;
                currentObj.renderData(data);
            }
            else if (currentObj._animation.panning)
            { currentObj.renderData(data); }
            else
            {
                // TODO: Determine other nodes.
                var animVectors = _.map(data, determineOtherNodes);
                _.each(animVectors, function(av)
                {
                    if (!av.otherNdoe || currentObj._animation.direction == 'gather')
                    { currentObj._animation.renderAfter.push(av); }
                    else
                    { currentObj._animation.renderAtOtherNode.push(av); }
                })

                if (currentObj._animation.direction == 'spread'
                    && currentObj._animation.renderAtOtherNode.length > 0)
                { currentObj.renderData(currentObj._animation.renderAtOtherNode); }

                // TODO: Build animations.
                // TODO: Animate.
                currentObj._displayLayer.removeFeatures(_.pluck(animVectors, 'otherNode'));
                currentObj._displayLayer.addFeatures(currentObj._animation.renderAfter);
            }
        }
    }, {}, 'socrataDataLayer');
})(jQuery);
