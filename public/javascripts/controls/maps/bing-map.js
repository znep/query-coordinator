(function($)
{
    $.Control.registerMixin('bing', {
        initializeVisualization: function()
        {
            this._super();

            var mapObj = this;
            // App-specific credentials.  See www.bingmapsportal.com
            var mapOptions = {
                credentials: 'AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO',
                 enableClickableLogo: false,
                 enableSearchLogo: false};

            if (mapObj._displayFormat.viewport)
            {
                mapOptions.zoom = mapObj._displayFormat.viewport.zoom;
                var center = mapObj._displayFormat.viewport.center;
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

            if (mapObj._primaryView.snapshotting)
            {
                var resetSnapTimer = function()
                {
                    if (!$.isBlank(mapObj._primaryView._snapshot_timeout))
                    {
                        clearTimeout(mapObj._primaryView._snapshot_timeout);
                        mapObj._primaryView._snapshot_timeout = null;
                    }
                };

                // Once the rows are loaded, look for the last 'onchangeview' event
                mapObj._primaryView.bind('request_finish', function()
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
                            mapObj._primaryView._snapshot_timeout = setTimeout(
                                 mapObj._primaryView.takeSnapshot, 5000);
                        });
                    mapObj._snapshot_bound = true;
                }, mapObj);
            }

            mapObj.mapLoaded();
        },

        currentZoom: function()
        {
            if (this.map)
            { return this.map.getZoom(); }
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

            if (geoType == 'point')
            {
                mapObj._markers[dupKey].clusterParent = details.clusterParent;
                mapObj._markers[dupKey].clusterDestroy = function()
                {
                    _.each(this, function(shape)
                    { mapObj.map.entities.remove(shape); });
                };
            }

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
                        {
                            mapObj._primaryView.highlightRows(shape.rows, 'select');
                            mapObj.$dom().trigger('display_row', [{row: _.first(shape.rows)}]);
                            $(document).trigger(blist.events.DISPLAY_ROW, [_.first(shape.rows).id, true]);
                        }
                    });

                if (mapObj._infoOpen &&
                        _.any(details.rows, function(r) { return $.subKeyDefined(mapObj._primaryView,
                                'highlightTypes.select.' + r.id); }))
                { showInfoWindow(mapObj, shape); }

                Microsoft.Maps.Events.addHandler(shape, 'mouseover', function()
                { mapObj._primaryView.highlightRows(details.rows); });

                Microsoft.Maps.Events.addHandler(shape, 'mouseout', function()
                { mapObj._primaryView.unhighlightRows(details.rows); });
            });

            shapes.startAnimation  = function() {};
            shapes.finishAnimation = function() {};
            shapes.clusterDestroy  = function()
            {
                _.each(shapes, function(shape) { mapObj.map.entities.remove(shape); });
                delete mapObj._markers[dupKey];
            };

            return shapes;
        },

        renderCluster: function(cluster, details)
        {
            var mapObj = this;

            if (cluster.size <= 0) { return; }

            var shape = new Microsoft.Maps.Pushpin(
                            new Microsoft.Maps.Location(cluster.centroid.lat,
                                                        cluster.centroid.lon),
                            { icon: '/images/poi_search_cluster.png' });
            shape = decorateBingShape(shape);

            shape.clusterId     = cluster.id;
            shape.clusterParent = cluster.parent;

            var dupKey = shape.getLocation().toString();
            if (mapObj._markers[dupKey])
            {
                mapObj._animation.olds = _.reject(mapObj._animation.olds, function(marker)
                    { return marker == mapObj._markers[dupKey]; });
                return mapObj._markers[dupKey];
            }

            mapObj._markers[dupKey] = shape;
            mapObj.map.entities.push(shape);

            var darkBG = mapObj.currentZoom() < 5;
            var boundary = new Microsoft.Maps.Polygon(_.map(cluster.polygon, function(vertex)
                { return new Microsoft.Maps.Location(vertex.lat, vertex.lon); }),
                {
                    fillColor: darkBG ? new Microsoft.Maps.Color(51, 173, 216, 230)
                                      : new Microsoft.Maps.Color(51, 0, 0, 255),
                    strokeColor: darkBG ? new Microsoft.Maps.Color(128, 155, 155, 155)
                                        : new Microsoft.Maps.Color(255, 0, 0, 0),
                    strokeThickness: 3,
                    visible: false
                });
            mapObj.map.entities.push(boundary);

            Microsoft.Maps.Events.addHandler(shape, 'click',
                function(event)
                {
                    mapObj.map.setView({ center: shape.getLocation(),
                                         zoom: mapObj.map.getZoom() + 1 });
                });
            Microsoft.Maps.Events.addHandler(shape, 'mouseover',
                function(event) { boundary.setOptions({ visible: true }); });
            Microsoft.Maps.Events.addHandler(shape, 'mouseout',
                function(event) { boundary.setOptions({ visible: false }); });

            var offset = $((shape['cm1001_er_etr'] || {}).dom).offset();
            offset.top  += (shape.getHeight() - 3);
            offset.left -= 10;
            var label = $('<div class="bing_cluster_labels"></div>');
            label.css({ 'left': offset.left + 'px', 'top': offset.top + 'px' })
                 .text(cluster.size);
            $('body').append(label.hide());

            shape._$label = label;
            shape._boundary = boundary;

            shape.startAnimation  = function() { label.hide(); };
            shape.finishAnimation = function()
            {
                if (!shape['cm1001_er_etr']) { return; }
                var $dom = $(shape['cm1001_er_etr'].dom);
                var bcOffset = blist.$container.offset();
                if (offset.top < bcOffset.top
                    || offset.top + label.height() > bcOffset.top + blist.$container.height()
                    || offset.left < bcOffset.left
                    || offset.left + label.width() > bcOffset.left + blist.$container.width())
                { return; }
                label.show();
            };
            shape.clusterDestroy  = function()
            {
                if (!mapObj._markers[dupKey]) { return; }
                mapObj.map.entities.remove(mapObj._markers[dupKey]);
                mapObj._markers[dupKey]._$label.remove();
                mapObj.map.entities.remove(mapObj._markers[dupKey]._boundary);
                delete mapObj._markers[dupKey];
            };

            return shape;
        },

        // FIXME: This is a skeleton. It is not intended to be used.
/*
        renderHeat: function()
        {
            var mapObj = this;

            if (mapObj._displayFormat.plotStyle != 'rastermap')
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

        dataRendered: function()
        {
            var mapObj = this;

            mapObj._super();
            if (!mapObj._animation) { return; }

            var clearClusters = function()
            {
                if (!mapObj._animation) { return; }
                _.each(mapObj._animation.news, function(marker)
                { marker.finishAnimation(); });
                _.each(mapObj._animation.olds, function(marker)
                { marker.clusterDestroy(); });
            }

            if (mapObj._animation.direction == 'none')
            { clearClusters(); return; }

            var animKey  = mapObj._animation.direction == 'spread' ? 'news' : 'olds';
            var otherKey = mapObj._animation.direction == 'gather' ? 'news' : 'olds';
            mapObj._animation.animations = _(mapObj._animation[animKey]).chain().map(
                function(marker)
                {
                    if (!marker.clusterParent) { return; }

                    var markerDom;
                    if (!marker.clusterId) { markerDom = marker[0]; }

                    var animation = { duration: 1000 };
                    animation.$marker = $((markerDom || marker)['cm1001_er_etr'].dom);
                    var otherNode = (_.detect(mapObj._animation[otherKey], function(m)
                    { return marker.clusterParent.id == m.clusterId; }) || {})['cm1001_er_etr'];

                    if (!otherNode) { return; }

                    if (mapObj._animation.direction == 'spread')
                    {
                        animation.from = $(otherNode.dom).offset();
                        animation.to = $((markerDom || marker)['cm1001_er_etr'].dom).offset();
                    }
                    else
                    {
                        animation.from = $((markerDom || marker)['cm1001_er_etr'].dom).offset();
                        animation.to = $(otherNode.dom).offset();
                    }

                    marker.startAnimation();

                    return animation;
                }).compact().flatten().value();

            if (mapObj._animation.direction == 'spread')
            { _.each(mapObj._animation.olds, function(m)
                { m.clusterDestroy(); }); }

            animate(mapObj._animation.animations, function()
            { clearClusters(); delete mapObj._animation; });
        },

        setAnimationOlds: function()
        {
            var mapObj = this;
            if (!_.isEmpty(mapObj._markers))
            {
                if (mapObj._lastRenderType == 'points')
                { mapObj._animation.olds = $.extend(true, {}, mapObj._markers); }
                else // Clusters
                { mapObj._animation.olds = _.select(mapObj._markers,
                function(marker) { return marker.clusterId; }); }
            }
        },

        adjustBounds: function()
        {
            var mapObj = this;
            if (mapObj._viewportListener &&
                $.subKeyDefined(mapObj, '_primaryView.query.namedFilters.viewport'))
            { return; }

            if (mapObj._viewportListener)
            {
                Microsoft.Maps.Events.removeHandler(mapObj._viewportListener);
                delete mapObj._viewportListener;
            }

            if (mapObj._displayFormat.viewport)
            {
                mapObj.setViewport(mapObj._displayFormat.viewport);
                if (!$.subKeyDefined(mapObj, '_primaryView.query.namedFilters.viewport'))
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
                    mapObj.updateDatasetViewport(mapObj._isResize);
                    delete mapObj._isResize;
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

        fitPoint: function(point)
        {
            var p = new Microsoft.Maps.Location(point.latitude, point.longitude);
            if (!this.map.getBounds().contains(p))
            { this.map.setView({center: p}); }
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

        clearGeometries: function()
        {
            this.map.entities.clear();
            $(".bing_cluster_labels").remove();
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            mapObj._super();
            if (!mapObj._animation && mapObj._renderType == 'points')
            { mapObj.clearGeometries(); }

            mapObj._hideBingTiles = false;
        },

        reset: function()
        {
            var mapObj = this;

            mapObj.clearGeometries();
            mapObj._super();
        },

        resizeHandle: function()
        {
            var mapObj = this;
            var $par = mapObj.$dom().parent();
            var sibH = 0;
            mapObj.$dom().siblings(':visible').each(function()
            { sibH += $(this).height(); });
            if (!$.isBlank(mapObj.map))
            {
                mapObj._isResize = true;
                mapObj.map.setOptions({ width: $par.width(), height: $par.height() - sibH });
            }
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
    }, {defaultZoom: 13}, 'socrataMap');

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
            .prepend('<img src="https://www.google.com/intl/en_us/mapfiles/iw_close.gif"/>');

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
            mapObj._infoOpen = false;
            // Hide all selected rows
            if ($.subKeyDefined(mapObj._primaryView, 'highlightTypes.select'))
            {
                mapObj._primaryView.unhighlightRows(
                    _.values(mapObj._primaryView.highlightTypes.select), 'select');
                mapObj.$dom().trigger('display_row', [{row: null}]);
            }
            closeInfoWindow();
        });

        $box.css({ left: x, top: y });

        var l = Microsoft.Maps.Events.addHandler(mapObj.map, 'viewchange',
            function() { closeInfoWindow(); Microsoft.Maps.Events.removeHandler(l); });
        mapObj._infoOpen = true;

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

    var animate = function(animations, callback)
    {
        var startTime = $.now();
        var interval;
        var step = function()
        {
            if (requestAnimationFrame && animations.length > 0)
            { requestAnimationFrame( step ); }

            animations = _.reject(animations, function(animation)
            {
                if (!animation.finished)
                {
                    var p = ($.now() - startTime) / animation.duration;
                    animation.finished = p >= 1;
                    var delta = function(start, end)
                    {
                        var pos = ((-Math.cos(p*Math.PI)/2) + 0.5);
                        return start + ((end - start) * pos);
                    };
                    animation.$marker.offset({
                        top:  delta(animation.from.top,  animation.to.top),
                        left: delta(animation.from.left, animation.to.left)
                        });
                    return false;
                }
                animation.$marker.offset(animation.to);
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
            }
        };
        if (requestAnimationFrame)
        { requestAnimationFrame( step ); }
        else
        { interval = setInterval( step, 13 ); }
    };

})(jQuery);
