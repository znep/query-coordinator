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
                    { mapObj._markerClusterer = new MarkerClusterer(mapObj.map, _.values(mapObj._markers)); }
                    else
                    { mapObj._markerClusterer.addMarkers(_.values(mapObj._markers)); }
                }
                mapObj.adjustBounds();
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
