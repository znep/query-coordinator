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
                        $("img.MSVE_ImageTile", blist.$display)
                            .css('visibility', 'hidden');
                    }
                });
            },

            renderPoint: function(latVal, longVal, rowId, details)
            {
                var mapObj = this;

                var ll = new VELatLong(latVal, longVal);
                var shape = new VEShape(VEShapeType.Pushpin, ll);
                if (mapObj._markers[rowId])
                {
                    mapObj._shapeLayer.DeleteShape(mapObj._markers[rowId]);
                }
                mapObj._markers[rowId] = shape;

                if (!_.isNull(details.title))
                {
                    shape.SetTitle(details.title);
                }

                if (!_.isNull(details.info))
                {
                    shape.SetDescription("<div class='mapInfoContainer" +
                        (mapObj._infoIsHtml ? ' html' : '') + "'>" +
                        details.info + "</div>");
                }
                if (details.icon)
                {
                    shape.SetCustomIcon(details.icon);
                }

                mapObj._shapeLayer.AddShape(shape);

                return true;
            },

            renderFeature: function(feature, segmentIndex)
            {
                var mapObj = this;
                var polygons = Dataset.map.toBing.feature(feature.geometry);

                var dojoColor = mapObj._segmentSymbols[segmentIndex].color;
                var color = new VEColor(dojoColor.r, dojoColor.g,
                                        dojoColor.b, dojoColor.a);
                _.each(polygons, function(polygon)
                {
                    polygon.SetFillColor(color);
                    polygon.HideIcon();

                    var info = mapObj._quantityCol.name;
                    info    += ': ';
                    info    += feature.attributes.quantity;
                    info    += '<br />';
                    info    += feature.attributes.description;

                    polygon.SetTitle(feature.attributes['NAME']);
                    polygon.SetDescription(info);

                    mapObj._shapeLayer.AddShape(polygon);
                });

                if (!mapObj._customInfoBoxSet)
                {
                    mapObj.map.AttachEvent('onclick', function(event)
                    {
                        if (feature.attributes.redirect_to)
                        { window.open(feature.attributes.redirect_to); }
                        mapObj.map.ShowInfoBox(
                            mapObj.map.GetShapeByID(event.elementID));
                    });
                    mapObj._customInfoBoxSet = true;
                }
            },

            adjustBounds: function()
            {
                var mapObj = this;

                if (mapObj._shapeLayer.GetShapeCount() > 1)
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
            },

            hideLayers: function()
            {
                var mapObj = this;
                //mapObj.map.HideBaseTileLayer();
                mapObj.map.HideDashboard();
                mapObj._hideBingTiles = true;
                blist.$display.css('height', '100%');
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
                mapObj.map.Resize($par.width(), $par.height() - sibH);
            },

            clearFeatures: function()
            {
                var mapObj = this;

                mapObj.map.DeleteAllShapeLayers();
                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);
            }
        }
    }));
})(jQuery);
