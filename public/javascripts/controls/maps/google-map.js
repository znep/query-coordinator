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
                mapObj.map = new google.maps.Map(mapObj.$dom()[0], mapOptions);

                mapObj._bounds = new google.maps.LatLngBounds();
                mapObj._boundsCounts = 0;

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

            rowsRendered: function()
            {
                var mapObj = this;
                if (mapObj._markerClusterer)
                {
                    mapObj._markerClusterer.clearMarkers();
                    _.each(mapObj._markers, function(marker)
                    { marker.setMap(mapObj.map); marker.setVisible(true); });
                }
                if (mapObj.settings.view.displayFormat.clusterMarkers
                    && mapObj._rowsLeft == 0)
                {
                    if (!mapObj._markerClusterer)
                    { mapObj._markerClusterer =
                        new MarkerClusterer(mapObj.map, _.values(mapObj._markers)); }
                    else
                    { mapObj._markerClusterer.addMarkers(_.values(mapObj._markers)); }
                }
                mapObj.adjustBounds();
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

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._viewportListener)
                { google.maps.event.removeListener(mapObj._viewportListener); }

                if (mapObj.settings.view.displayFormat.viewport)
                { mapObj.setViewport(mapObj.settings.view.displayFormat.viewport); }
                else if (mapObj._boundsCounts > 1 ||
                    mapObj.settings.view.displayFormat.heatmap)
                { mapObj.map.fitBounds(mapObj._bounds); }
                else
                {
                    mapObj.map.setCenter(mapObj._bounds.getCenter());
                    mapObj.map.setZoom(mapObj.settings.defaultZoom);
                }

                // Don't attach viewportListener unless all rows are loaded.
                var rowsLoaded = _.reduce(mapObj._dataViews,
                    function(total, view) { return total + view._rows.length; }, 0);
                if (mapObj._totalRows > rowsLoaded && mapObj._maxRows > rowsLoaded)
                { return; }

                // Begin Rabbit Hole.
                var l = google.maps.event.addListener(mapObj.map, 'idle', function()
                {
                    google.maps.event.removeListener(l);
                    mapObj._viewportListener = google.maps.event.addListener(
                        mapObj.map, 'bounds_changed', function()
                        {
                            if (mapObj._extentChanging) { return; }
                            mapObj._extentChanging = google.maps.event.addListener(
                                mapObj.map, 'idle', function()
                                {
                                    google.maps.event.removeListener(
                                        mapObj._extentChanging);
                                    mapObj._extentChanging = false;
                                    var newViewport = mapObj.getViewport();
                                    if (_.isEqual(
                                        mapObj.settings.view.displayFormat.viewport,
                                        newViewport))
                                    { return; }
                                    mapObj.settings.view.update({
                                        displayFormat: $.extend({},
                                            mapObj.settings.view.displayFormat,
                                            { viewport: newViewport })
                                    }, false, true);
                                    mapObj.updateRowsByViewport(null, true);
                                }
                            );
                        });
                });
            },

            getViewport: function(with_bounds)
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
                if (with_bounds)
                {
                    var bounds = mapObj.map.getBounds();
                    var ne = bounds.getNorthEast();
                    var sw = bounds.getSouthWest();
                    $.extend(viewport, {
                        xmin: sw.lng(), xmax: ne.lng(),
                        ymin: sw.lat(), ymax: ne.lat()
                    });
                }
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

            getRequiredJavascripts: function()
            {
                // This is a terrible hack; but we need to know if Google
                // has already been loaded, since it has a special callback.
                // We can't store a normal object var, because the whole
                // library is being recreated
                if (blist.util.googleCallbackMap) { return null; }

                blist.util.googleCallback = this._setupLibraries;
                blist.util.googleCallbackMap = this;
                return "http://maps.google.com/maps/api/js?sensor=false&callback=blist.util.googleCallback";

            },

            _setupLibraries: function()
            {
                // Grab a reference to the current object (this) from a global
                var mapObj = blist.util.googleCallbackMap;
                mapObj._librariesLoaded();
            }
        }
    }));
})(jQuery);
