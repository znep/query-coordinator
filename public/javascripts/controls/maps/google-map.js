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

            renderPoint: function(latVal, longVal, rowId, details)
            {
                var mapObj = this;

                var hasInfo = !$.isBlank(details.info) || !$.isBlank(details.title);
                var ll = new google.maps.LatLng(latVal, longVal);
                var marker = new google.maps.Marker({position: ll,
                    title: details.title, clickable: hasInfo,
                    map: mapObj.map, icon: details.icon});
                if (mapObj._markers[rowId]) mapObj._markers[rowId].setMap(null);
                mapObj._markers[rowId] = marker;

                if (hasInfo)
                {
                    marker.infoContent = '';
                    if (!$.isBlank(details.title))
                    {
                        marker.infoContent += "<div class='mapTitle'>" +
                            details.title + '</div>';
                    }
                    if (!$.isBlank(details.info))
                    {
                        marker.infoContent += "<div class='mapInfoContainer" +
                            (mapObj._infoIsHtml ? ' html' : '') + "'>" +
                            details.info + "</div>";
                    }
                    google.maps.event.addListener(marker, 'click',
                        function() { markerClick(mapObj, marker); });
                }
                mapObj._bounds.extend(ll);
                mapObj._boundsCounts++;

                return true;
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

            renderFeature: function(feature, segmentIndex)
            {
                var mapObj = this;
                var polygon = Dataset.map.toGoogle.feature(feature.geometry);
                var center = esri.geometry.webMercatorToGeographic(
                    feature.geometry.getExtent().getCenter());
                center = new google.maps.LatLng(center.y, center.x);
                mapObj._infoTemplate = _.template("<b><%= name %></b><br />" +
                    "<%= col %>: <%= quantity %><br /><%= description %>");

                polygon.setOptions({
                    fillColor: mapObj._segmentSymbols[segmentIndex].color.toHex(),
                    fillOpacity: 1.0,
                    strokeColor: "#000000",
                    strokeWeight: 1
                });
                google.maps.event.addListener(polygon, 'click', function()
                {
                    if (!mapObj.infoWindow)
                    { mapObj.infoWindow = new google.maps.InfoWindow({maxWidth: 300}); }
                    mapObj.infoWindow.setPosition(center);
                    mapObj.infoWindow.setContent(mapObj._infoTemplate({
                        name: feature.attributes['NAME'],
                        col: mapObj._quantityCol.name,
                        quantity: feature.attributes.quantity,
                        description: feature.attributes.description
                    }));
                    mapObj.infoWindow.open(mapObj.map);
                });

                if (feature.attributes.redirect_to)
                {
                    google.maps.event.addListener(polygon, 'click', function()
                    { window.open(feature.attributes.redirect_to); });
                    google.maps.event.addListener(polygon, 'mouseover', function()
                    { mapObj.$dom().find('div .container').css('cursor', 'pointer'); });
                    google.maps.event.addListener(polygon, 'mouseout', function()
                    { mapObj.$dom().find('div .container').css('cursor', 'default'); });
                }
                polygon.setMap(mapObj.map);
                mapObj._markers[feature.attributes['NAME']] = polygon;
                mapObj._bounds.union(Dataset.map.toGoogle.extent(
                    feature.geometry.getExtent()));
                mapObj._boundsCounts++;
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
                if (mapObj.settings.view.totalRows > mapObj._rows.length &&
                    mapObj._maxRows > mapObj._rows.length)
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
                $('> div > div:first > div:last', mapObj.$dom())
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

    var markerClick = function(mapObj, marker)
    {
        if (mapObj.infoWindow === undefined)
        { mapObj.infoWindow = new google.maps.InfoWindow({maxWidth: 300}); }

        mapObj.infoWindow.setContent(marker.infoContent);
        mapObj.infoWindow.open(mapObj.map, marker);
    };
})(jQuery);
