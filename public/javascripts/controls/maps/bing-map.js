(function($)
{
    $.socrataMap.bing = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataMap.bing.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataMap.bing, $.socrataMap.extend(
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
                mapObj.map = new VEMap(mapObj.$dom().attr('id'));
                // App-specific credentials.  See www.bingmapsportal.com
                mapObj.map.SetCredentials('AnhhVZN-sNvmtzrcM7JpQ_vfUeVN9AJNb-5v6dtt-LzCg7WEVOEdgm25BY_QaSiO');
                mapObj.map.LoadMap();
                mapObj.map.EnableShapeDisplayThreshold(false);

                mapObj.resizeHandle();

                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);

                // Known Bug: This event is attached every time the Plot Style is
                // modified. This bug should be reasonably rare.
                mapObj.map.AttachEvent('onchangeview', function()
                {
                    if (mapObj._hideBingTiles)
                    {
                        $("img.MSVE_ImageTile", mapObj.$dom())
                            .css('visibility', 'hidden');
                    }
                });

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
                        mapObj.map.AttachEvent('onchangeview', function(event)
                        {
                            resetSnapTimer();
                            mapObj.settings.view._snapshot_timeout = setTimeout(
                                 mapObj.settings.view.takeSnapshot, 5000);
                        });
                        mapObj._snapshot_bound = true;
                    });
                }
            },

            renderGeometry: function(geoType, geometry, dupKey, details)
            {
                var mapObj = this;

                var bingifyPoint = function(point)
                    { return new VELatLong(point[0], point[1]); };

                var shapeType;
                switch(geoType)
                {
                    case 'point':
                        shapeType = VEShapeType.Pushpin;
                        geometry = new VELatLong(geometry.latitude, geometry.longitude);
                        geometry = [geometry];
                        break;
                    case 'polygon':
                        shapeType = VEShapeType.Polygon;
                        if (geometry instanceof esri.geometry.Polygon)
                        { geometry = Dataset.map.toBing.polygon(geometry); }
                        else
                        { geometry = _.map(geometry.rings, function(ring)
                            { return _.map(ring, bingifyPoint); }); }
                        break;
                    case 'polyline':
                        shapeType = VEShapeType.Polyline;
                        geometry = _.map(geometry.paths, function(path)
                            { return _.map(path, bingifyPoint); });
                        break;
                }

                var shapes = (geometry[0] instanceof VEShape) ?
                    geometry :
                    _.map(geometry, function(g) { return new VEShape(shapeType, g); });

                if (mapObj._markers[dupKey])
                {
                    _.each(mapObj._markers[dupKey], function(shape)
                        { mapObj._shapeLayer.DeleteShape(shape); });
                }
                mapObj._markers[dupKey] = shapes;

                _.each(shapes, function(shape)
                {
                    if (!_.isNull(details.title))
                    { shape.SetTitle(details.title); }

                    if (!_.isNull(details.info))
                    { shape.SetDescription("<div class='mapInfoContainer" +
                        (mapObj._infoIsHtml ? ' html' : '') + "'>" +
                        details.info + "</div>"); }
                    if (details.color && geoType != 'point')
                    {
                        var method;
                        switch(geoType)
                        {
                            case 'polygon':  method = 'SetFillColor'; break;
                            case 'polyline': method = 'SetLineColor'; break;
                        }
                        color = $.hexToRgb(details.color);
                        shape[method](new VEColor(color.r, color.g,
                                                  color.b, 1.0));
                    }

                    if (geoType != 'point')
                    { shape.HideIcon(); }
                    else if (details.icon)
                    { shape.SetCustomIcon(details.icon); }

                    mapObj._shapeLayer.AddShape(shape);
                });

                if (!mapObj._customInfoBoxSet)
                {
                    mapObj.map.AttachEvent('onclick', function(event)
                    {
                        if (details.redirect_to)
                        { window.open(details.redirect_to); }
                        mapObj.map.ShowInfoBox(
                            mapObj.map.GetShapeByID(event.elementID));
                    });
                    mapObj._customInfoBoxSet = true;
                }

                return true;
            },

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._viewportListener)
                { mapObj.map.DetachEvent('onchangeview', mapObj._viewportListener); }
                if (!mapObj._boundsAdjusting)
                {
                    mapObj._boundsAdjusting = function()
                    {
                        mapObj.map.DetachEvent('onchangeview', mapObj._boundsAdjusting);
                        mapObj.map.AttachEvent('onchangeview', mapObj._viewportListener);
                    };
                }

                if (mapObj.settings.view.displayFormat.viewport)
                { mapObj.setViewport(mapObj.settings.view.displayFormat.viewport); }
                else if (mapObj._shapeLayer.GetShapeCount() > 1)
                {
                    mapObj.map.SetMapView
                        (mapObj._shapeLayer.GetBoundingRectangle());
                }
                else if (mapObj._shapeLayer.GetShapeCount() == 1)
                {
                    mapObj.map.SetCenterAndZoom
                            (mapObj._shapeLayer.GetShapeByIndex(0).GetPoints()[0],
                            mapObj.settings.defaultZoom);
                }
                mapObj.map.AttachEvent('onchangeview', mapObj._boundsAdjusting);

                if (!mapObj._viewportListener)
                {
                    mapObj._viewportListener = function()
                    {
                        mapObj.settings.view.update({
                            displayFormat: $.extend({},
                                mapObj.settings.view.displayFormat,
                                { viewport: mapObj.getViewport() })
                        }, false, true);
                        mapObj.updateRowsByViewport();
                    };
                }
            },

            getViewport: function(with_bounds)
            {
                var mapObj = this;
                var viewport = {
                    center: mapObj.map.GetCenter(),
                    zoom: mapObj.map.GetZoomLevel()
                };
                viewport.center = {
                    Latitude: viewport.center.Latitude,
                    Longitude: viewport.center.Longitude
                };
                if (with_bounds)
                {
                    var bounds = mapObj.map.GetMapView();
                    // The variable names look wonky, but VELatLongRectangle seems
                    // to be buggy and inverts the sign for Latitudes.
                    var sw = bounds.TopLeftLatLong;
                    var ne = bounds.BottomRightLatLong;
                    $.extend(viewport, {
                        xmin: sw.Longitude, xmax: ne.Longitude,
                        ymin: ne.Latitude, ymax: sw.Latitude
                    });
                }
                return viewport;
            },

            setViewport: function(viewport)
            {
                var mapObj = this;
                mapObj.map.SetCenterAndZoom(new VELatLong(
                    viewport.center.Latitude, viewport.center.Longitude),
                    viewport.zoom);
            },

            hideLayers: function()
            {
                var mapObj = this;
                //mapObj.map.HideBaseTileLayer();
                mapObj.map.HideDashboard();
                mapObj._hideBingTiles = true;
                mapObj.$dom().css('height', '100%');
            },

            resetData: function()
            {
                var mapObj = this;

                mapObj.map.DeleteAllShapeLayers();
                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);
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
                { mapObj.map.Resize($par.width(), $par.height() - sibH); }
            },

            clearFeatures: function()
            {
                var mapObj = this;

                mapObj.map.DeleteAllShapeLayers();
                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);
            },

            getRequiredJavascripts: function()
            {
                // Workaround for crappy JS coding, see:
                // http://code.davidjanes.com/blog/2008/11/08/how-to-dynamically-load-map-apis/
                var scripts = [];
                if (!window.attachEvent)
                {
                    scripts.push("http://dev.virtualearth.net/mapcontrol/v6.2/js/atlascompat.js");
                    scripts.push(false); // Wait for that to load
                }
                scripts.push("http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=6.2");
                return scripts;
            }
        }
    }));
})(jQuery);
