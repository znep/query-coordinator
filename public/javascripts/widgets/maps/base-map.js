(function($)
{
    // Set up namespace for particular plugins to class themselves under
    $.socrataMap =
    {
        extend: function(extHash, extObj)
        {
            if (!extObj) { extObj = socrataMapObj; }
            return $.extend({}, extObj, extHash,
            {
                defaults: $.extend({}, extObj.defaults, extHash.defaults || {}),
                prototype: $.extend({}, extObj.prototype, extHash.prototype || {})
            });
        }
    };

    $.fn.socrataMap = function(options)
    {
        // Check if object was already created
        var socrataMap = $(this[0]).data("socrataVisualization");
        if (!socrataMap)
        {
            var mapClass = $.socrataMap[options.displayFormat.type || 'google'];
            if (mapClass !== null && mapClass !== undefined)
            {
                socrataMap = new mapClass(options, this[0]);
            }
        }
        return socrataMap;
    };

    var socrataMapObj = function(options, dom)
    {
        this.settings = $.extend({}, socrataMapObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(socrataMapObj, $.socrataVisualization.extend(
    {
        defaults:
        {
            defaultZoom: 1
        },

        prototype:
        {
            initializeVisualization: function ()
            {
                var mapObj = this;

                mapObj._markers = {};

                if (mapObj.$dom().siblings('#mapLayers').length < 1)
                {
                    mapObj.$dom().before('<div id="mapLayers" class="hide">' +
                        '<a href="#toggleLayers" class="toggleLayers">' +
                        'Layer Options' +
                        '</a>' +
                        '<div class="contentBlock hide">' +
                        '<h3>Layers</h3><ul></ul>' +
                        '</div>' +
                        '</div>');
                    mapObj.$dom().siblings('#mapLayers').find('a.toggleLayers')
                        .click(function(e)
                        {
                            e.preventDefault();
                            mapObj.$dom().siblings('#mapLayers')
                                .find('.contentBlock').toggleClass('hide');
                        });
                }
                else { mapObj.$dom().siblings('#mapLayers').addClass('hide'); }

                mapObj.initializeMap();

                mapObj.populateLayers();
            },

            reset: function(newOptions)
            {
                var mapObj = this;
                mapObj.$dom().removeData('socrataVisualization');
                mapObj.$dom().empty();
                // We need to change the ID so that maps (such as ESRI) recognize
                // something has changed, and reload properly
                mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
                mapObj.$dom().socrataMap(newOptions);
            },

            reloadVisualization: function()
            {
                var mapObj = this;
                mapObj.$dom().siblings('#mapLayers').addClass('hide');

                mapObj.resetData();

                mapObj._idIndex = undefined;
                mapObj._locCol = undefined;
                mapObj._latIndex = undefined;
                mapObj._longIndex = undefined;
                mapObj._titleCol = undefined;
                mapObj._infoCol = undefined;
                mapObj._infoIsHtml = false;
            },

            populateLayers: function()
            {
                var mapObj = this;
                var layers = mapObj.getLayers();
                if (layers.length < 2) { return; }

                var $layers = mapObj.$dom().siblings('#mapLayers');
                var $layersList = $layers.find('ul');
                $layersList.empty();
                _.each(layers, function(l)
                {
                    var lId = 'mapLayer_' + l.id;
                    $layersList.append('<li><input type="checkbox" id="' + lId +
                        '"' + (l.visible ? ' checked="checked"' : '') +
                        ' /><label for="' + lId + '">' + l.name + '</label></li>');
                });

                $layers.find(':checkbox').click(function(e)
                {
                    var $check = $(e.currentTarget);
                    mapObj.setLayer($check.attr('id').replace(/^mapLayer_/, ''),
                        $check.value());
                });

                $layers.removeClass('hide');
            },

            setLayer: function(layerId, isDisplayed)
            {
                // Implement me
            },

            updateMap: function(settings)
            {
                var mapObj = this;
                // Can't save settings w/ out editable view
                if (!blist.display.editable) { return; }

                // Gather state information
                var zoom = settings.zoom;
                if (zoom !== undefined) { mapObj._displayConfig.zoom = zoom; }
                var extent = settings.extent;
                if (extent !== undefined)
                {
                    mapObj._displayConfig.extent = {
                        xmin: extent.xmin,
                        ymin: extent.ymin,
                        xmax: extent.xmax,
                        ymax: extent.ymax,
                        spatialReference: { wkid: extent.spatialReference.wkid }
                    };
                }

                // Write to server
                $.ajax({ url: '/views/' + blist.display.viewId + '.json',
                        type: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify(
                            { displayFormat: mapObj._displayConfig })
                    });
            },

            initializeMap: function()
            {
                // Implement me
            },

            getLayers: function()
            {
                return [];
            },

            resetData: function()
            {
                // Implement if you need to reset any data when the map is reset
            },

            renderRow: function(row)
            {
                var mapObj = this;
                if (_.isUndefined(mapObj._locCol) &&
                    (_.isUndefined(mapObj._latIndex) ||
                     _.isUndefined(mapObj._longIndex)))
                {
                    mapObj.errorMessage = 'No columns defined';
                    return false;
                }

                var lat;
                var longVal;
                if (!_.isUndefined(mapObj._locCol))
                {
                    var loc = row[mapObj._locCol.dataIndex];
                    if (_.isNull(loc)) { return true; }
                    lat = parseFloat(loc[mapObj._locCol.latSubIndex]);
                    longVal = parseFloat(loc[mapObj._locCol.longSubIndex]);
                }
                else
                {
                    lat = row[mapObj._latIndex];
                    longVal = row[mapObj._longIndex];
                }

                // Incomplete points will be safely ignored
                if (_.isNull(lat) || _.isNaN(lat) ||
                    _.isNull(longVal) || _.isNaN(longVal)) { return true; }
                if (lat <= -90 || lat >= 90 || longVal <= -180 || longVal >= 180)
                {
                    mapObj.errorMessage = 'Latitude must be between -90 and 90, ' +
                        'and longitude must be between -180 and 180';
                    return false;
                }
                var title = getText(row, mapObj._titleCol, true);
                var info = getText(row, mapObj._infoCol, false);

                return mapObj.renderPoint(lat, longVal, title,
                    info, row[mapObj._idIndex]);
            },

            renderPoint: function(latVal, longVal, title, info, rowId)
            {
                // Implement me
            },

            rowsRendered: function()
            {
                // Override if you wish to do something other than adjusting the
                // map to fit the points
                this.adjustBounds();
            },

            adjustBounds: function()
            {
                // Implement if desired to adjust map bounds after data is rendered
            },

            resizeHandle: function(event)
            {
                // Implement if you need to do anything on resize
            },

            getColumns: function(view)
            {
                var mapObj = this;
                if (!getColumns(mapObj, view))
                { getLegacyColumns(mapObj, view); }
            }
        }
    }));

    var getText = function(row, col, plain)
    {
        var t = !_.isUndefined(col) ?
            row[col.dataIndex] : null;
        if (!_.isNull(t) && col.renderTypeName == 'location')
        {
            var a = t[col.addressSubIndex];
            if (_.isNull(a) || _.isUndefined(a))
            { t = null; }
            else
            {
                t = blist.data.types.location
                    .renderAddress({human_address: a}, plain);
            }
        }
        return t;
    };

    var getColumns = function(mapObj, view)
    {
        if (view.displayFormat === undefined ||
            (view.displayFormat.plot === undefined &&
             view.displayFormat.latitudeId === undefined))
        { return false; }

        mapObj._infoIsHtml = false;
        var colFormat = view.displayFormat.plot || view.displayFormat;
        _.each(view.columns, function(c, i)
        {
            if (c.dataTypeName == 'meta_data' && c.name == 'sid')
            { mapObj._idIndex = i; }

            // Preferred location column
            if (c.tableColumnId == colFormat.locationId)
            {
                c.dataIndex = i;
                c.latSubIndex = _.indexOf(c.subColumnTypes, 'latitude');
                c.longSubIndex = _.indexOf(c.subColumnTypes, 'longitude');
                mapObj._locCol = c;
            }

            // Older separate lat/long
            if (c.tableColumnId == colFormat.latitudeId || c.id == colFormat.ycol)
            { mapObj._latIndex = i; }
            if (c.tableColumnId == colFormat.longitudeId || c.id == colFormat.xcol)
            { mapObj._longIndex = i; }

            if (c.tableColumnId == colFormat.titleId || c.id == colFormat.titleCol)
            {
                c.dataIndex = i;
                if (c.renderTypeName == 'location')
                {
                    c.addressSubIndex =
                        _.indexOf(c.subColumnTypes, 'human_address');
                }
                mapObj._titleCol = c;
            }
            if (c.tableColumnId == colFormat.descriptionId ||
                c.id == colFormat.bodyCol)
            {
                c.dataIndex = i;
                if (c.renderTypeName == 'location')
                {
                    c.addressSubIndex =
                        _.indexOf(c.subColumnTypes, 'human_address');
                }
                mapObj._infoCol = c;
                mapObj._infoIsHtml = c.renderTypeName == 'html';
            }
        });

        return true;
    };

    var getLegacyColumns = function(mapObj, view)
    {
        _.each(view.columns, function(c, i) { c.dataIndex = i; });
        var cols = _.select(view.columns, function(c)
            { return c.dataTypeName != 'meta_data' &&
                (c.flags === undefined || !_.include(c.flags, 'hidden')); });
        cols = _.sortBy(cols, function(c) { return c.position; });

        if (cols.length < 2) { return false; }

        mapObj._idIndex = _.detect(view.columns, function(c)
            { return c.dataTypeName == 'meta_data' && c.name == 'sid'; }).dataIndex;
        mapObj._latIndex = cols[0].dataIndex;
        mapObj._longIndex = cols[1].dataIndex;
        mapObj._infoIsHtml = false;
        if (cols.length > 2)
        {
            var infoCol = cols[2];
            mapObj._infoCol = infoCol;
            mapObj._infoIsHtml = infoCol.renderTypeName == 'html';
        }
        return true;
    };

})(jQuery);
