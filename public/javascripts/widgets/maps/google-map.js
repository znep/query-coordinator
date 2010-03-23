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
            },

            renderPoint: function(latVal, longVal, title, info, rowId)
            {
                var mapObj = this;

                var hasInfo = info !== null;
                var ll = new google.maps.LatLng(latVal, longVal);
                var marker = new google.maps.Marker({position: ll,
                    title: title, clickable: hasInfo, map: mapObj.map});
                mapObj._markers[rowId] = marker;

                if (hasInfo)
                {
                    marker.infoContent = "<div class='mapInfoContainer" +
                        (mapObj._infoIsRich ? ' richText' : '') + "'>" +
                        info + "</div>";
                    google.maps.event.addListener(marker, 'click',
                        function() { markerClick(mapObj, marker); });
                }
                mapObj._bounds.extend(ll);
            },

            adjustBounds: function()
            {
                this.map.fitBounds(this._bounds);
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
