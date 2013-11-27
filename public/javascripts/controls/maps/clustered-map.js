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

            layerObj.viewportHandler()
                .events.register('viewportchanged', layerObj, layerObj.onViewportChange);
        },

        destroy: function()
        {
            this._super();
            this._clusterBoundaries.destroy();
            this.viewportHandler()
                .events.unregister('viewportchanged', this, this.onViewportChange);
        },

        onViewportChange: function()
        {
            var layerObj = this;
            if (layerObj.viewportHandler().viewportInOriginal
                && layerObj._firstRenderType == 'points')
            { delete layerObj._neverCluster; }

            if (!layerObj._staledCluster
                || layerObj._renderType == 'points'
                || layerObj._staledCluster.isStale())
            { _.defer(function() { layerObj.getData(); }); }
        },

        layersToRestack: function()
        {
            return this._super().unshift(this._clusterBoundaries);
        },

        clickFeature: function(feature)
        {
            var layerObj = this;
            if (this._renderType == 'points') { return this._super(feature); }

            this.viewportHandler().stopExpecting();
            this._clusterBoundaries.removeAllFeatures();
            var currentZoom = this._map.getZoom();
            var bboxZoom = this._map.getZoomForExtent(feature.attributes.bbox);
            if (currentZoom < bboxZoom && this._map.isValidZoomLevel(bboxZoom))
            { this._map.zoomToExtent(feature.attributes.bbox); }
            else
            { this._map.setCenter(feature.geometry.getBounds().getCenterLonLat(), currentZoom + 1); }

            if (feature.attributes.forever)
            {
                if (this.settings.showRowLink && !this._parent._displayFormat.hideRowLink)
                {
                    this.flyoutHandler().add(layerObj, feature.geometry.toLonLat(),
                        '<div class="foreverNode">' +
                        '<div>' + $.t('controls.map.forever_node_title') + '</div>' +
                        $.t('controls.map.forever_node_explanation') + ' ' +
                        $.t('controls.map.forever_node_recommend') +
                        '</div>'
                        );

                    $(".olFramedCloudPopupContent .foreverNode a").click(function(e)
                    {
                        e.preventDefault();
                        if (!layerObj._parent._primaryView) { return; }
                        var newMD = $.extend(true, {}, layerObj._parent._primaryView.metadata);
                        if (layerObj._view.id != layerObj._parent._primaryView.id)
                        { $.deepSet(newMD, layerObj._view.id,'renderTypeConfig','active','table','id'); }
                        $.deepSet(newMD, true, 'renderTypeConfig', 'visible', 'table');
                        layerObj._parent._primaryView.update({metadata: newMD});
                        layerObj._view.showRenderType('table');
                    });
                }
                else
                { this.flyoutHandler().add(layerObj, feature.geometry.toLonLat(),
                    '<div class="foreverNode">' +
                    '<div>' + $.t('controls.map.forever_node_title') + '</div>' +
                    $.t('controls.map.forever_node_explanation') +
                    '</div>'
                    ); }
            }
        },

        overFeature: function(feature)
        {
            if (this._renderType == 'points') { return this._super(feature); }
            this._clusterBoundaries.addFeatures(feature.boundary());
            if (feature.translucentOnHover)
            {
                feature.style.graphicOpacity = 0.5;
                this._displayLayer.drawFeature(feature);
            }
        },

        outFeature: function(feature)
        {
            if (this._renderType == 'points') { return this._super(feature); }
            this._clusterBoundaries.removeAllFeatures();
            if (feature.translucentOnHover)
            {
                feature.style.graphicOpacity = 1;
                this._displayLayer.drawFeature(feature);
            }
        },

        getData: function()
        {
            var layerObj = this;

            if (layerObj._fetchPoints)
            { layerObj._super(); return; }

            if (layerObj._neverCluster)
            { layerObj.fetchPoints(); return; }

            var viewport = layerObj._guessedViewport || layerObj.viewportHandler()
                .toViewport(blist.openLayers.geographicProjection),
                locCol = layerObj._locCol || layerObj._geoCol;

            if (_.isUndefined(locCol))
            {
                layerObj._parent.errorMessage = $.t('controls.map.no_columns_defined');
                return;
            }

            layerObj._view.getClusters(viewport, { plot: { locationId: locCol.tableColumnId }},
                layerObj.getMinDistanceForViewportPixels(viewport),
                function(data)
            {
                if (layerObj._neverCluster
                    || _.reduce(data, function(memo, cluster) { return memo + cluster.size; }, 0)
                        < layerObj.settings.clusterThreshold)
                { layerObj.fetchPoints(); return; }

                // A mere single cluster is essentially useless.
                // Make an attempt to break it into its children.
                if (!layerObj._guessedViewport
                    && data.length == 1 && !_.isEmpty(data[0].children)
                    && layerObj.viewportHandler().isWholeWorld())
                { layerObj.attemptViewportGuess(data[0]); return; }

                if (layerObj._guessedViewport)
                {
                    if (data.length == 1)
                    { layerObj._singleCluster = data[0]; }
                    delete layerObj._guessedViewport;
                }
                else
                { delete layerObj._singleCluster; }

                layerObj._renderType = 'clusters';
                layerObj._firstRenderType = layerObj._firstRenderType || 'clusters';

                _.defer(function() {
                    layerObj.handleDataLoaded(data);
                    layerObj._dataLoaded = true;
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
            this._firstRenderType = this._firstRenderType || 'points';
            this.filterWithViewport();
            delete this._fetchPoints;
        },

        attemptViewportGuess: function(cluster)
        {
            this._guessedViewport = { xmin: cluster.box.lon1, ymin: cluster.box.lat1,
                                      xmax: cluster.box.lon2, ymax: cluster.box.lat2 };
            this.getData();
        },

        // clustered#handleDataLoaded calls #clearData, which is correct but does not mean
        // we want to re-trigger a "figure out your own zoom level". So this stops it from
        // thinking this is a completely new map, yet again.
        clearData: function()
        {
            var dataLoaded = this._dataLoaded;
            this._super.apply(this, arguments);
            this._dataLoaded = dataLoaded;
        },

        preferredExtent: function()
        {
            var layerObj = this;
            if (layerObj._singleCluster)
            {
                var pe;
                if (!_.isEmpty(layerObj._singleCluster.children))
                {
                    pe = _.reduce(layerObj._singleCluster.children, function(viewport, child)
                    {
                        var vp = OpenLayers.Bounds.fromClusterBox(child.box);

                        if (viewport)
                        { viewport.extend(vp); return viewport; }
                        else
                        { return vp; }
                    }, null);
                }
                else
                { pe = OpenLayers.Bounds.fromClusterBox(layerObj._singleCluster.box); }
                return pe.transform(blist.openLayers.geographicProjection, layerObj._mapProjection);
            }
            else
            { return layerObj._super(); }
        },

        filterWithViewport: function()
        {
            var query = $.extend(true, {}, this._query),
                locCol = this._locCol || this._geoCol;

            if ((query.namedFilters || {}).viewport)
            { delete query.namedFilters.viewport; }
            query.namedFilters = $.extend(true, query.namedFilters || {},
                { viewport: this.viewportHandler().toQuery(
                    blist.openLayers.geographicProjection, locCol.fieldName) });

            if (_.isEqual(this._query, query)
                && $.subKeyDefined(this._view, 'query.namedFilters.viewport'))
            { this.getData(); }
            else
            { this.setQuery(query, true); }
        },

        handleQueryChange: function()
        {
            this._dataLoaded = false;
            this._super.apply(this, arguments);
        },

        handleRowChange: function(rows)
        {
            // It doesn't make sense to listen to row changes when we're clustering.
            if (this._renderType == 'points') { this._super.apply(this, arguments); }
        },

        handleDataLoaded: function(data)
        {
            if (_.isUndefined(this._neverCluster))
            {
                if (this._renderType == 'points')
                {
                    var totalRows = this._view.totalRows();
                    if (totalRows)
                    { this._neverCluster = totalRows < this.settings.clusterThreshold; }
                }
                else
                { this._neverCluster = false; }
            }

            if (_.isEmpty(data)
                || (this._renderType == 'clusters' && _.first(data).centroid)
                || (this._renderType == 'points' && !_.first(data).centroid))
            {
                if (_.any([this._lastRenderType, this._renderType],
                    function(rt) { return rt == 'clusters'; }))
                { this.clearData(); }
                this._super(data);
            }

            this._lastRenderType = this._renderType;
            if (this._staledCluster)
            { this._staledCluster.update(); }
            else if (this.settings.staleClusters)
            {
                this._map.addControl(this._staledCluster = new blist.openLayers.StaledCluster());
                this._staledCluster.viewportPercentage = this.settings.staleClusters;
            }

            delete this._ignoreTemporary; // No reason to ignore temporaries anymore.
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

            var bbox = OpenLayers.Bounds.fromClusterBox(cluster.box)
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
            else { this._ignoreTemporary = true; }
            this._super.call(this, query);
        }
    }, {
        clusterThreshold: 300, // Number of points before clustering.
        staleClusters: 0.15,   // Prevent small pan actions from updating clusters.
        defaultPixelSize: 45   // Size of a medium cluster, to minimize cluster overlap.
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
