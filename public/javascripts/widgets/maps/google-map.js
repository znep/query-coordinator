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
                mapObj.map = new google.maps.Map(mapObj.$dom()[0],
                    {
                        zoom: 3,
                        center: new google.maps.LatLng(40.000, -100.000),
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });

                mapObj._bounds = new google.maps.LatLngBounds();
                mapObj._boundsCounts = 0;
            },

            renderPoint: function(latVal, longVal, title, info, rowId, icon)
            {
                var mapObj = this;

                var hasInfo = info !== null;
                var ll = new google.maps.LatLng(latVal, longVal);
                var marker = new google.maps.Marker({position: ll,
                    title: title, clickable: hasInfo || title !== null,
                    map: mapObj.map, icon: icon});
                if (mapObj._markers[rowId]) mapObj._markers[rowId].setMap(null);
                mapObj._markers[rowId] = marker;

                if (hasInfo)
                {
                    marker.infoContent = "<div class='mapInfoContainer" +
                        (mapObj._infoIsHtml ? ' html' : '') + "'>" +
                        info + "</div>";
                    google.maps.event.addListener(marker, 'click',
                        function() { markerClick(mapObj, marker); });
                }
                mapObj._bounds.extend(ll);
                mapObj._boundsCounts++;

                return true;
            },

            adjustBounds: function()
            {
                var mapObj = this;
                if (mapObj._boundsCounts > 1)
                { mapObj.map.fitBounds(mapObj._bounds); }
                else
                {
                    mapObj.map.setCenter(mapObj._bounds.getCenter());
                    mapObj.map.setZoom(mapObj.settings.defaultZoom);
                }
            },

            resetData: function()
            {
                var mapObj = this;
                if (mapObj.infoWindow !== undefined) { mapObj.infoWindow.close(); }
                _.each(mapObj._markers, function(m) { m.setMap(null); });
                mapObj._markers = {};

                mapObj._bounds = new google.maps.LatLngBounds();
                mapObj._boundsCounts = 0;
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
