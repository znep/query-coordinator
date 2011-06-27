(function($)
{
    $.socrataMap.google = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataMap.google.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataMap.google, $.socrataMap.extend(
    {
        defaults:
        {
            defaultZoom: 13
        },

        prototype:
        {
            initializeMap: function()
            {
                var mapObj = this;
                var mapOptions = {
                    zoom: 3,
                    center: new google.maps.LatLng(40.000, -100.000),
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                if (mapObj.settings.view.displayFormat.viewport)
                {
                    mapOptions.zoom = mapObj.settings.view.displayFormat.viewport.zoom;
                    var center = mapObj.settings.view.displayFormat.viewport.center;
                    mapOptions.center = new google.maps.LatLng(center.lat, center.lng);
                }

                mapObj.map = new google.maps.Map(mapObj.$dom()[0], mapOptions);

                mapObj._bounds = new google.maps.LatLngBounds();
                mapObj._boundsCounts = 0;

                mapObj._listeners = {};
                mapObj._listeners.boundChanged = google.maps.event.addListener(mapObj.map,
                    'bounds_changed', function()
                    {
                        if (!mapObj._ready || mapObj._boundsChanging) { return; }
                        // Ignore bounds events unless all rows are loaded
                        var rowsLoaded = _.reduce(mapObj._dataViews,
                            function(total, view) { return total + view._rows.length; }, 0);
                        if (mapObj._totalRows > rowsLoaded && mapObj._maxRows > rowsLoaded)
                        { return; }

                        // Mark the event so idle can handle it once done
                        mapObj._boundsChanging = true;
                    });

                mapObj._listeners.idle = google.maps.event.addListener(mapObj.map, 'idle', function()
                    {
                        // Catch first idle to let us know the map is ready; we don't
                        // want to do anything until that happens
                        if (!mapObj._ready)
                        {
                            mapObj._ready = true;
                            // On initial zoom, save off viewport
                            if ($.isBlank(mapObj._currentViewport))
                            { mapObj._currentViewport = mapObj.getViewport(); }
                            return;
                        }
                        if (!mapObj._boundsChanging) { return; }
                        delete mapObj._boundsChanging;

                        mapObj.updateDatasetViewport();
                        mapObj.updateRowsByViewport(null, true);
                    });

                // For snapshotting
                if (mapObj.settings.view.snapshotting)
                {
                    mapObj.settings.view.bind('finish_request', function()
                    {
                        if (!$.isBlank(mapObj._snapshot_event_bounds))
                        { return; }

                        var clearSnapTimeout = function()
                        {
                            if (!$.isBlank(mapObj._snapshot_timeout))
                            {
                                clearTimeout(mapObj._snapshot_timeout);
                                mapObj._snapshot_timeout = null;
                            }
                        };

                        mapObj._snapshot_event_bounds = true;

                        google.maps.event.addListener(mapObj.map, 'tilesloaded', function(a){
                            clearSnapTimeout();
                            mapObj._snapshot_timeout = setTimeout(function()
                                { mapObj.settings.view.takeSnapshot();  },
                            2000);
                        });

                        google.maps.event.addListener(mapObj.map, 'zoom_changed', function(a){
                            // Points were rendered which caused a redraw, clear timer
                            // and wait for tiles again
                            clearSnapTimeout();
                        });
                    });
                }
            },

            renderGeometry: function(geoType, geometry, dupKey, details)
            {
                var mapObj = this;

                var googlifyPoint = function(point)
                    { return new google.maps.LatLng(point[0], point[1]); };

                var extent;
                if (geometry instanceof esri.geometry.Polygon)
                { extent = Dataset.map.toGoogle.extent(geometry.getExtent()); }
                if (geoType == 'polyline')
                {   // sigh
                    geometry.spatialReference = { wkid: 4326 };
                    extent = Dataset.map.toGoogle.extent(
                        new esri.geometry.Polyline(geometry).getExtent());
                }

                switch(geoType)
                {
                    case 'point':
                        geometry = new google.maps.Marker(
                            {position: new google.maps.LatLng(geometry.latitude,
                                                              geometry.longitude) });
                        break;
                    case 'polygon':
                        if (geometry instanceof esri.geometry.Polygon)
                        { geometry = Dataset.map.toGoogle.polygon(geometry); }
                        else
                        { geometry = new google.maps.Polygon({paths:
                            _.map(geometry.rings,
                            function(ring) { return _.map(ring, googlifyPoint); }) }); }
                        break;
                    case 'polyline':
                        geometry = _.map(geometry.paths, function(path)
                            { return new google.maps.Polyline(
                                {path: _.map(path, googlifyPoint) }); });
                        break;
                }

                if (details.color instanceof dojo.Color)
                { details.color = details.color.toHex(); }
                geometry.heatStrength = details.heatStrength || 1;

                switch(geoType)
                {
                    case  'point':
                        geometry.setOptions({clickable: true,
                            map: mapObj.map, icon: details.icon});
                        break;
                    case 'polyline':
                        geometry.each(function(g) {
                            g.setOptions({
                                strokeColor: details.color || "#FF00FF",
                                strokeWeight: details.size
                            });
                            g.setMap(mapObj.map);
                        });
                        break;
                    case 'polygon':
                        geometry.setOptions({
                            fillColor: details.color || "#FF00FF",
                            fillOpacity: 1.0,
                            strokeColor: "#000000",
                            strokeWeight: 1
                        });
                        geometry.setMap(mapObj.map);
                        break;
                }

                if (mapObj._markers[dupKey])
                { mapObj._markers[dupKey].setMap(null); }
                mapObj._markers[dupKey] = geometry;

                google.maps.event.addListener(geometry, 'click', function(evt)
                {
                    if (!mapObj.infoWindow)
                    { mapObj.infoWindow =
                        new google.maps.InfoWindow({maxWidth: 300}); }
                    mapObj.infoWindow.setContent(mapObj.getFlyout(details.rows,
                            details.flyoutDetails, details.dataView)[0]);
                    // evt.latLng if it's not a point; pull .position for points
                    mapObj.infoWindow.setPosition(evt.latLng || geometry.position);
                    mapObj.infoWindow.open(mapObj.map);
                });

                if (details.redirect_to)
                {
                    google.maps.event.addListener(geometry, 'click', function()
                    { window.open(details.redirect_to); });
                    google.maps.event.addListener(geometry, 'mouseover', function()
                    { mapObj.$dom().find('div .container')
                        .css('cursor', 'pointer'); });
                    google.maps.event.addListener(geometry, 'mouseout', function()
                    { mapObj.$dom().find('div .container')
                        .css('cursor', 'default'); });
                }

                if (geoType == 'point')
                { mapObj._bounds.extend(geometry.position); }
                else
                { mapObj._bounds.union(extent); }
                mapObj._boundsCounts++;

                return true;
            },

            renderCluster: function(cluster, details)
            {
                var mapObj = this;

                if (cluster.count <= 0) { return; }

                var cluster_icon = '/images/map_cluster_';
                var vOffset;
                if (cluster.count < 100)
                { cluster_icon += 'small.png'; vOffset = 22; }
                else if (cluster.count < 1000)
                { cluster_icon += 'med.png';   vOffset = 27; }
                else
                { cluster_icon += 'large.png'; vOffset = 37; }

                var cluster_class = 'google_cluster_labels';
                if (cluster.count < 100) { cluster_class += ' small'; }

                var graphic = new MarkerWithLabel({
                    labelContent: cluster.count,
                    labelAnchor: new google.maps.Point(20, vOffset),
                    labelClass: cluster_class, map: mapObj.map,
                    icon: cluster_icon,
                    position: new google.maps.LatLng(cluster.point.lat,
                                                     cluster.point.lon)
                });

                graphic.heatStrength = cluster.count;
                mapObj._markers[graphic.getPosition().toString()] = graphic;

                google.maps.event.addListener(graphic, 'click', function(evt)
                {
                    // evt.latLng if it's not a point; pull .position for points
                    mapObj.map.setCenter(evt.latLng || graphic.position);
                    mapObj.map.setZoom(mapObj.map.getZoom() + 1);
                });

                mapObj._bounds.extend(graphic.getPosition());
                mapObj._boundsCounts++;
            },

            // FIXME: This is a skeleton. It is not intended to be used.
/*
            renderHeat: function()
            {
                var mapObj = this;

                if (mapObj.settings.view.displayFormat.plotStyle != 'rastermap')
                { return; }

                if (!mapObj._heatLayer)
                { mapObj._heatLayer =
                    h337.create({"element":mapObj.currentDom, "radius":25, "visible":true});}

                // Step 1: Enter data into the CANVAS heatmap.
                var markers = _.select(mapObj._markers, function(marker)
                { return marker instanceof SocrataMarker || marker instanceof MarkerWithLabel; })

                mapObj._heatLayerMax = mapObj._heatLayer.store.max = _.reduce(markers,
                function(total, marker) { return total + marker.heatStrength; }, 0) / 10;

                _.each(markers, function(marker)
                {
                    marker.show();
                    var offset = marker.pixel_;
                    if (offset)
                    { mapObj._heatLayer.store.addDataPoint(offset.x, offset.y); }
                    marker.hide();
                });

                // Step 2: Convert CANVAS heatmap into Image/PNG.
                var heatData = mapObj._heatLayer.getImageData();
                var $heatLayer = $(mapObj._heatLayer.get('canvas'));
                var topOffset = $heatLayer.offset().top;
                mapObj._heatLayer.clear();
                $heatLayer.remove();
                delete mapObj._heatLayer;

                // Step 3: Convert IMG tiles into CANVAS tiles: Map + Heat.
                if (mapObj._heater) { google.maps.event.removeListener(mapObj._heater); }
                delete mapObj._heater;
                mapObj._heater = google.maps.event.addListener(mapObj.map, 'tilesloaded', function()
                {
                    var srcHeatmap = new Image();
                    srcHeatmap.src = mapObj._lastHeatData = heatData;
                    srcHeatmap.onload = function(){
                        var $layer = $('> div > div:first > div > div:last > div', mapObj.$dom());
                        mapObj._foobar = $layer; // DEBUG
                        var translation = $layer.parent().parent()
                            .attr('style').match(/translate\((-?\d+)px, (-?\d+)px\)/);
                        if (translation)
                        { translation =
                            { x: parseInt(translation[1]), y: parseInt(translation[2]) }; }
                        $layer.find("canvas").remove();
                        $layer.children().each(function()
                        {
                            var gdiv   = this;
                            var $gdiv  = $(this);
                            var $gTile = $gdiv.find('img');
                            var gTile  = $gTile[0];

                            var tile    = document.createElement("canvas");
                            tile.width  = gTile.width;
                            tile.height = gTile.height;
                            var tileCtx = tile.getContext("2d");
                            tileCtx.drawImage(gTile, 0, 0);

                            var position = $gTile.offset();
                            position.top  -= translation.y;
                            position.left -= translation.x;
                            var width = gTile.width;
                            var height = gTile.height;
                            var dx = 0; var dy = 0;
                            if (position.left < 0)
                            {
                                width += position.left;
                                dx = -position.left;
                                position.left = 0;
                            }
                            if (position.top < 0)
                            {
                                height += position.top;
                                dy = -position.top;
                                position.top = 0;
                            }
                            if (width < 0 || height < 0) { return; }
                            tileCtx.drawImage(srcHeatmap, position.left, position.top,
                                                          width, height,
                                                          dx, dy, width, height);

                            gTile.style.display = 'none';
                            $gdiv.append(tile);
                        });
                    };
                });
            },
*/

            adjustBounds: function()
            {
                var mapObj = this;
                if ($.subKeyDefined(mapObj, 'settings.view.query.namedFilters.viewport'))
                { return; }

                if (mapObj.settings.view.displayFormat.viewport)
                {
                    mapObj.setViewport(mapObj.settings.view.displayFormat.viewport);
                    if (_.isEmpty(mapObj.settings.view.query))
                    { mapObj.updateRowsByViewport(null, true); }
                }
                else if (mapObj._boundsCounts > 1 ||
                    mapObj.settings.view.displayFormat.heatmap)
                { mapObj.map.fitBounds(mapObj._bounds); }
                else
                {
                    mapObj.map.setCenter(mapObj._bounds.getCenter());
                    mapObj.map.setZoom(mapObj.settings.defaultZoom);
                }
            },

            getCustomViewport: function()
            {
                var mapObj = this;
                var viewport = {
                    center: mapObj.map.getCenter(),
                    zoom: mapObj.map.getZoom()
                };
                viewport.center = {
                    lat: viewport.center.lat(),
                    lng: viewport.center.lng()
                };

                var bounds = mapObj.map.getBounds();
                if ($.isBlank(bounds)) { return null; }

                var ne = bounds.getNorthEast();
                var sw = bounds.getSouthWest();
                $.extend(viewport, {
                    xmin: sw.lng(), xmax: ne.lng(),
                    ymin: sw.lat(), ymax: ne.lat()
                });

                return viewport;
            },

            setViewport: function(viewport)
            {
                var mapObj = this;
                mapObj.map.setCenter(new google.maps.LatLng(
                    viewport.center.lat, viewport.center.lng));
                mapObj.map.setZoom(viewport.zoom);
            },

            resetData: function()
            {
                var mapObj = this;
                if (mapObj.infoWindow !== undefined) { mapObj.infoWindow.close(); }
                _.each(mapObj._markers, function(m) { m.setMap(null); });

                mapObj._bounds = new google.maps.LatLngBounds();
                mapObj._boundsCounts = 0;
            },

            unhookMap: function()
            {
                var mapObj = this;
                _.each(mapObj._listeners, function(l)
                    { google.maps.event.removeListener(l); });
            },

            hideLayers: function()
            {
                var mapObj = this;
                $('> div > div:first > div > div:last', mapObj.$dom())
                    .css('visibility', 'hidden');
                if (!mapObj._hideTiles)
                { mapObj._hideTiles = google.maps.event.addListener(mapObj.map,
                    'tilesloaded', function() { mapObj.hideLayers(); }); }
            },

            clearFeatures: function()
            {
                var mapObj = this;
                _.each(mapObj._markers, function(m) { m.setMap(null); });
                mapObj._markers = {};
            },

            resizeHandle: function(event)
            {
                if ($.subKeyDefined(window, 'google'))
                { google.maps.event.trigger(this.map, 'resize'); }
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
                return "https://maps.google.com/maps/api/js?sensor=false&callback=blist.util.googleCallback";
            },

            _setupLibraries: function()
            {
                // Grab a reference to the current object (this) from a global
                var mapObj = blist.util.googleCallbackMap;
                add_markerwithlabel();
                mapObj._librariesLoaded();
            }
        }
    }));

/*
    var SocrataMarker;
    var createSocrataMarker = function()
    {
        SocrataMarker = function(opt_options)
        {
            this.marker_ = new google.maps.Marker(opt_options);
            this.position = this.marker_.position;
            if (_.include(_.keys(opt_options), 'map'))
            { this.setMap(opt_options.map); }
        };
        SocrataMarker.prototype = new google.maps.OverlayView();
        SocrataMarker.prototype.setOptions = function(options)
        {
            this.marker_.setOptions(options);
            if (_.include(_.keys(options), 'map'))
            { this.setMap(options.map); }
        };
        SocrataMarker.prototype.show = function()
        { this.marker_.setVisible(true); };
        SocrataMarker.prototype.hide = function()
        { this.marker_.setVisible(false); };

        SocrataMarker.prototype.draw = function()
        { this.pixel_ = this.getProjection()
            .fromLatLngToContainerPixel(this.marker_.position); };
    };
*/
})(jQuery);
