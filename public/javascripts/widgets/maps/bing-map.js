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

                mapObj.resizeHandle();

                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);
            },

            renderPoint: function(latVal, longVal, title, info, rowId, icon)
            {
                var mapObj = this;

                var ll = new VELatLong(latVal, longVal);
                var shape = new VEShape(VEShapeType.Pushpin, ll);
                if (mapObj._markers[rowId])
                {
                    mapObj._shapeLayer.DeleteShape(mapObj._markers[rowId]);
                }
                mapObj._markers[rowId] = shape;

                if (!_.isNull(title))
                {
                    shape.SetTitle(title);
                }

                if (!_.isNull(info))
                {
                    shape.SetDescription("<div class='mapInfoContainer" +
                        (mapObj._infoIsHtml ? ' html' : '') + "'>" +
                        info + "</div>");
                }
                if (icon)
                {
                    shape.SetCustomIcon(icon);
                }

                mapObj._shapeLayer.AddShape(shape);

                return true;
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

            resetData: function()
            {
                var mapObj = this;

                mapObj.map.DeleteAllShapeLayers();
                mapObj._shapeLayer = new VEShapeLayer();
                mapObj.map.AddShapeLayer(mapObj._shapeLayer);
                mapObj._markers = {};
            },

            resizeHandle: function()
            {
                var mapObj = this;
                var $par = mapObj.$dom().parent();
                var sibH = 0;
                mapObj.$dom().siblings(':visible').each(function()
                { sibH += $(this).height(); });
                mapObj.map.Resize($par.width(), $par.height() - sibH);
            }
        }
    }));
})(jQuery);
