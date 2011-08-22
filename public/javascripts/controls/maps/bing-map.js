(function($)
{
    $.socrataMap.bing = $.socrataMap.extend({
        _init: function()
        {
            var defaults = { defaultZoom: 13 };
            arguments[0] = $.extend(defaults, arguments[0]);
            this._super.apply(this, arguments);
        },

        initializeVisualization: function()
        {
            this._super();

            var mapObj = this;
            // App-specific credentials.  See www.bingmapsportal.com
            var mapOptions = {
                credentials: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                 enableClickableLogo: false,
                 enableSearchLogo: false};

            if (mapObj.settings.view.displayFormat.viewport)
            {
                mapOptions.zoom = mapObj.settings.view.displayFormat.viewport.zoom;
                var center = mapObj.settings.view.displayFormat.viewport.center;
                mapOptions.center = new Microsoft.Maps.Location(
                    center.latitude || center.lat, center.longitude || center.lng);
            }

            mapObj.map = new Microsoft.Maps.Map(mapObj.$dom()[0], mapOptions);

            mapObj.resizeHandle();

            var event_debugger = function()
            {
                _.each(['targetviewchanged', 'viewchange', 'viewchangestart', 'viewchangeend', 'mouseup', 'mousedown'], function(event) {
                Microsoft.Maps.Events.addHandler(mapObj.map, event, function()
                { console.log(event); }); });
            };
            //event_debugger();

            Microsoft.Maps.Events.addHandler(mapObj.map, 'mousedown', function()
            { mapObj._mouseActive = true; });
            Microsoft.Maps.Events.addHandler(mapObj.map, 'mouseup', function()
            {
                mapObj._mouseActive = false;
                if (mapObj._mousePanning)
                { mapObj._viewportHandler(); }
                mapObj._mousePanning = false;
            });

            mapObj._iconSizes = {};

            if (mapObj.settings.view.snapshotting)
            {
                var resetSnapTimer = function()
                {
                    if (!$.isBlank(mapObj.settings.view._snapshot_timeout))
                    {
                        clearTimeout(mapObj.settings.view._snapshot_timeout);
                        mapObj.settings.view._snapshot_timeout = null;
                    }
                };

                // Once the rows are loaded, look for the last 'onchangeview' event
                mapObj.settings.view.bind('finish_request', function()
                {
                    // Clear any existing requests
                    resetSnapTimer();
                    if (!$.isBlank(mapObj._snapshot_bound))
                    { return; }

                    // Don't care about this event until rows loaded
                    // TODO: Can probably use addThrottledHandler instead.
                    Microsoft.Maps.Events.addHandler(mapObj.map, 'viewchangeend',
                        function(event)
                        {
                            resetSnapTimer();
                            mapObj.settings.view._snapshot_timeout = setTimeout(
                                 mapObj.settings.view.takeSnapshot, 5000);
                        });
                    mapObj._snapshot_bound = true;
                });
            }

            mapObj.mapLoaded();
        },

        renderGeometry: function(geoType, geometry, dupKey, details)
        {
            var mapObj = this;

            var bingifyPoint = function(point)
                { return new Microsoft.Maps.Location(point[0], point[1]); };

            var shapeType;
            var shapes;
            switch(geoType)
            {
                case 'point':
                    shapeType = Microsoft.Maps.Pushpin;
                    geometry = new Microsoft.Maps.Location(geometry.latitude,
                                                           geometry.longitude);
                    geometry = [geometry];
                    break;
                case 'polygon':
                    shapeType = Microsoft.Maps.Polygon;
                    if (geometry instanceof esri.geometry.Polygon)
                    { shapes = Dataset.map.toBing.polygon(geometry); }
                    else
                    { geometry = _.map(geometry.rings, function(ring)
                        { return _.map(ring, bingifyPoint); }); }
                    break;
                case 'polyline':
                    shapeType = Microsoft.Maps.Polyline;
                    geometry = _.map(geometry.paths, function(path)
                        { return _.map(path, bingifyPoint); });
                    break;
            }

            shapes = shapes || _.map(geometry, function(g) { return new shapeType(g); });

            if (mapObj._markers[dupKey])
            {
                _.each(mapObj._markers[dupKey], function(shape)
                    { mapObj.map.entities.remove(shape); });
            }
            mapObj._markers[dupKey] = shapes;

            _.each(shapes, function(shape)
            {
                var hasHighlight = _.any(details.rows, function(r)
                    { return r.sessionMeta && r.sessionMeta.highlight; });
                if (details.icon)
                {
                    var ics = mapObj._iconSizes[details.icon];
                    if ($.isBlank(ics))
                    {
                        var image = new Image();
                        image.onload = function()
                        {
                            var s = mapObj._iconSizes[details.icon] =
                                {width: image.width, height: image.height};
                            shape.setOptions(s);
                        };
                        image.src = details.icon;
                    }
                    var opts = $.extend({ icon: details.icon }, ics);
                    shape.setOptions(opts);
                    shape.custom_icon = true;
                }
                else if (hasHighlight)
                { shape.setOptions({icon: '/images/bing-highlight.png'}); }

                shape.rows = details.rows;
                shape.flyoutDetails = details.flyoutDetails;
                shape.dataView = details.dataView;
                shape = decorateBingShape(shape);

                if (geoType != 'point')
                {
                    if (details.color || !_.isUndefined(details.opacity))
                    {
                        var key;
                        var options = {};
                        switch(geoType)
                        {
                            case 'polygon':
                                key = 'fillColor';
                                options.strokeColor = Microsoft.Maps.Color.fromHex('#000000');
                                break;
                            case 'polyline': key = 'strokeColor'; break;
                        }
                        options[key] = Microsoft.Maps.Color.fromHex(hasHighlight ?
                            ('#' + mapObj._highlightColor) : (details.color || '#FFFFFF'));
                        options[key].a = _.isUndefined(details.opacity) ? 1.0 : details.opacity;
                        options[key].a *= 255;
                        shape.setOptions(options);
                    }
                    shape.setOptions({ 'strokeThickness': 1 });
                }

                mapObj.map.entities.push(shape);

                $((shape['cm1001_er_etr'] || {}).dom).css('cursor', 'pointer');

                Microsoft.Maps.Events.addHandler(shape, 'click',
                    function(event)
                    {
                        if (details.redirect_to)
                        { window.open(details.redirect_to); }

                        if (showInfoWindow(mapObj, event.target))
                        { mapObj.settings.view.highlightRows(shape.rows, 'select'); }
                    });

                if (_.any(details.rows, function(r) { return $.subKeyDefined(mapObj.settings.view,
                                'highlightTypes.select.' + r.id); }))
                { showInfoWindow(mapObj, shape); }

                Microsoft.Maps.Events.addHandler(shape, 'mouseover', function()
                { mapObj.settings.view.highlightRows(details.rows); });

                Microsoft.Maps.Events.addHandler(shape, 'mouseout', function()
                { mapObj.settings.view.unhighlightRows(details.rows); });
            });

            return true;
        },

        renderCluster: function(cluster, details)
        {
            var mapObj = this;

            if (cluster.count <= 0) { return; }

            var shape = new Microsoft.Maps.Pushpin(
                            new Microsoft.Maps.Location(cluster.point.lat,
                                                        cluster.point.lon),
                            { icon: '/images/poi_search_cluster.png' });
            shape = decorateBingShape(shape);

            mapObj._markers[shape.getLocation().toString()] = shape;
            mapObj.map.entities.push(shape);

            Microsoft.Maps.Events.addHandler(shape, 'click',
                function(event)
                {
                    mapObj.map.setView({ center: shape.getLocation(),
                                         zoom: mapObj.map.getZoom() + 1 });
                });

            var offset = $((shape['cm1001_er_etr'] || {}).dom).offset();
            offset.top  += (shape.getHeight() - 3);
            offset.left -= 10;
            var label = $('<div class="bing_cluster_labels"></div>');
            label.css({ 'left': offset.left + 'px', 'top': offset.top + 'px' })
                 .text(cluster.count);
            $('body').append(label);
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
                h337.create({"element":mapObj.$dom().parent()[0], "radius":25, "visible":true});}

            _.each(_.compact(_.map(mapObj._markers, function(markers)
            { return markers.length == 1 ? markers[0] : null; })), function(marker)
            {
                var offset = $(marker['cm1001_er_etr'].dom).offset();
                var bcOffs = blist.$container.offset();
                offset.top -= bcOffs.top;
                offset.left += marker.getAnchor().x;
                offset.top  += marker.getAnchor().y;
                mapObj._heatLayer.store.addDataPoint(offset.left, offset.top);
            });
            mapObj.map.entities.clear();
        },
*/

        adjustBounds: function()
        {
            var mapObj = this;
            if (mapObj._viewportListener &&
                $.subKeyDefined(mapObj, 'settings.view.query.namedFilters.viewport'))
            { return; }

            if (mapObj._viewportListener)
            {
                Microsoft.Maps.Events.removeHandler(mapObj._viewportListener);
                delete mapObj._viewportListener;
            }

            if (mapObj.settings.view.displayFormat.viewport)
            {
                mapObj.setViewport(mapObj.settings.view.displayFormat.viewport);
                if (!$.subKeyDefined(mapObj, 'settings.view.query.namedFilters.viewport'))
                { mapObj.updateRowsByViewport(null, true); }
            }
            else if (mapObj.map.entities.getLength() > 1)
            {
                var locations = _.flatten(_.map(
                    arrayifyEntityCollection(mapObj.map.entities), function(entity)
                    { return $.makeArray(entity.getLocations()); }));
                mapObj.map.setView({ bounds:
                    Microsoft.Maps.LocationRect.fromLocations(locations) });
            }
            else if (mapObj.map.entities.getLength() == 1)
            {
                mapObj.map.setView({
                        center: mapObj.map.entities.get(0).getLocation(),
                        zoom: mapObj.settings.defaultZoom });
            }
            mapObj._boundsChanging = true;

            if (!mapObj._viewportListener)
            {
                mapObj._viewportListener = Microsoft.Maps.Events.addHandler(
                    mapObj.map,
                    'viewchangeend',
                    function()
                    {
                        // On initial zoom, save off viewport
                        if ($.isBlank(mapObj._currentViewport))
                        { mapObj._currentViewport = mapObj.getViewport(); }

                        if (mapObj._boundsChanging)
                        { mapObj._boundsChanging = false; return; }
                        if (mapObj._mouseActive)
                        { mapObj._mousePanning = true; return; }
                        mapObj._viewportHandler();
                    });
            }

            if (!mapObj._viewportHandler)
            {
                mapObj._viewportHandler = function() {
                    mapObj.updateDatasetViewport();
                    mapObj.updateRowsByViewport(null, true);
                };
            }

            if (!mapObj._viewportChanging)
            {
                mapObj._viewportChanging = Microsoft.Maps.Events.addHandler(
                    mapObj.map,
                    'viewchangestart',
                    function()
                    { $('.bing_cluster_labels').remove(); });
            }

            if (mapObj._hideLayerInterval)
            { mapObj.hideLayers(); }
        },

        getCustomViewport: function()
        {
            var mapObj = this;
            var center = mapObj.map.getCenter();
            var viewport = {
                center: {latitude: center.latitude, longitude: center.longitude},
                zoom: mapObj.map.getZoom()
            };

            var bounds = mapObj.map.getBounds();
            var nw = bounds.getNorthwest();
            var se = bounds.getSoutheast();
            $.extend(viewport, {
                xmin: nw.longitude, xmax: se.longitude,
                ymin: se.latitude, ymax: nw.latitude
            });

            return viewport;
        },

        setViewport: function(viewport)
        {
            var mapObj = this;
            var loc = new Microsoft.Maps.Location(viewport.center.latitude || viewport.center.lat,
                viewport.center.longitude || viewport.center.lng);
            mapObj.map.setView({ center: loc, zoom: viewport.zoom});
        },

        showLayers: function()
        {
            var mapobj = this;
            $(".MicrosoftMap > div:first > div:first img", mapObj.$dom())
                .css('visibility', 'visible');
            clearInterval(mapObj._hideLayerInterval);
        },

        hideLayers: function()
        {
            var mapObj = this;
            //mapObj.$dom().css('height', '100%');
            var $tiles = $(".MicrosoftMap > div:first > div:first img",
                mapObj.$dom());
            $tiles.css('visibility', 'hidden');
            if (!mapObj._hideLayerInterval)
            {
                mapObj._hideLayerInterval = setInterval(function()
                    { mapObj.hideLayers(); }, 500);
                setTimeout(function()
                {
                    clearInterval(mapObj._hideLayerInterval);
                    Microsoft.Maps.Events.addHandler(mapObj.map, 'viewchangeend',
                        function() { mapObj.hideLayers(); });
                    mapObj._hideLayerInterval = true;
                }, 5000);
            }
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            mapObj._super();

            mapObj.map.entities.clear();
            $(".bing_cluster_labels").remove();
            mapObj._hideBingTiles = false;
        },

        resizeHandle: function()
        {
            var mapObj = this;
            var $par = mapObj.$dom().parent();
            var sibH = 0;
            mapObj.$dom().siblings(':visible').each(function()
            { sibH += $(this).height(); });
            if (!$.isBlank(mapObj.map))
            { mapObj.map.setOptions({ width: $par.width(),
                                      height: $par.height() - sibH }); }
        },

        getRequiredJavascripts: function()
        {
            if (blist.util.bingCallbackMap) { return null; }

            bingCallback = this._setupLibraries;
            blist.util.bingCallbackMap = this;

            return "https://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onscriptload=bingCallback";
        },

        _setupLibraries: function()
        {
            var mapObj = blist.util.bingCallbackMap;
            mapObj._librariesLoaded();
        }
    });

    // It's Javascript. Why do they bother blackboxing this?
    var arrayifyEntityCollection = function(entities)
    {
        var length = entities.getLength();
        var collection =[];
        for (i=0; i<length; i++){
            collection.push(entities.get(i));
        }
        return collection;
    };

    var showInfoWindow = function(mapObj, shape)
    {
        var $flyout = mapObj.getFlyout(shape.rows, shape.flyoutDetails, shape.dataView);
        if ($.isBlank($flyout)) { return false; }

        var pixel = mapObj.map.tryLocationToPixel(
            shape.getLocation(),
            Microsoft.Maps.PixelReference.control);

        var $box = mapObj.$dom().siblings('#bing_infoWindow');
        if ($box.length < 1)
        {
            mapObj.$dom().after('<div id="bing_infoWindow">' +
                '<div id="bing_infoBeak"> </div><div id="bing_infoContent"></div></div>');
            $box = mapObj.$dom().siblings('#bing_infoWindow');
        }

        $box.show().find("#bing_infoContent").empty()
            .append($flyout)
            .prepend('<img src="https://www.google.com/intl/' +
                     'en_us/mapfiles/iw_close.gif"/>');

        var x = pixel.x;
        var y = pixel.y;
        if (shape instanceof Microsoft.Maps.Pushpin) { y -= shape.getHeight(); }
        else { y -= 17; } // Magic Number: aim for "actual" center of polygon/polyline
        // Magic Number: aim for the middle of the bing dot.
        if (!shape.custom_icon) { y -= 7; }


        if (x + $box.width() > $(mapObj.currentDom).width()) // warning: changed from blist.$container
        {
            $box.addClass('right');
            x -= $box.width();
        }
        else
        {
            $box.removeClass('right');
        }

        $box.find('#bing_infoContent img').click(function()
        {
            // Hide all selected rows
            if ($.subKeyDefined(mapObj.settings.view, 'highlightTypes.select'))
            {
                mapObj.settings.view.unhighlightRows(
                    _.values(mapObj.settings.view.highlightTypes.select), 'select');
            }
            closeInfoWindow();
        });

        $box.css({ left: x, top: y });

        var l = Microsoft.Maps.Events.addHandler(mapObj.map, 'viewchange',
            function() { closeInfoWindow(); Microsoft.Maps.Events.removeHandler(l); });

        return true;
    };

    var closeInfoWindow = function()
    {
        $("#bing_infoWindow").hide();
    };

    var decorateBingShape = function(shape)
    {
        if (!shape.getLocations) // is Pushpin
        {
            shape.getLocations = function()
                { return [this.getLocation()]; };
        }
        if (!shape.getLocation) // is Polygon or Polyline
        {
            shape.getLocation = function()
                { return Microsoft.Maps.LocationRect.fromLocations(
                    this.getLocations()).center; };
        }
        return shape;
    }

})(jQuery);
