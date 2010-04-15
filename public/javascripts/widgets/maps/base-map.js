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
        var socrataMap = $(this[0]).data("socrataMap");
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
            defaultZoom: 1,
            pageSize: 100
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
                else { $domObj.siblings('#mapLayers').addClass('hide'); }

                mapObj.initializeMap();

                mapObj.populateLayers();
            },

            reset: function(newOptions)
            {
                var mapObj = this;
                mapObj.$dom().removeData('socrataMap');
                mapObj.$dom().empty();
                // We need to change the ID so that maps (such as ESRI) recognize
                // something has changed, and reload properly
                mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
                mapObj.$dom().socrataMap(newOptions);
            },

            reload: function()
            {
                var mapObj = this;
                mapObj.$dom().siblings('#mapError').hide().text('');
                mapObj.$dom().siblings('#mapLayers').addClass('hide');

                mapObj.resetData();

                mapObj._rowsLeft = 0;
                mapObj._rowsLoaded = 0;

                mapObj._idIndex = undefined;
                mapObj._latIndex = undefined;
                mapObj._longIndex = undefined;
                mapObj._titleIndex = undefined;
                mapObj._infoIndex = undefined;
                mapObj._infoIsRich = false;

                loadRows(mapObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: mapObj.settings.pageSize});
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
                        data: $.json.serialize(
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
                if (mapObj._latIndex === undefined ||
                    mapObj._longIndex === undefined)
                {
                    mapObj.errorMessage = 'No columns defined';
                    return false;
                }

                var lat = row[mapObj._latIndex];
                var longVal = row[mapObj._longIndex];
                if (lat === null || longVal === null) { return; }
                if (lat < -90 || lat > 90 || longVal < -180 || longVal > 180)
                {
                    mapObj.errorMessage = 'Latitude must be between -90 and 90, ' +
                        'and longitude must be between -180 and 180';
                    return false;
                }
                var info = mapObj._infoIndex !== undefined ?
                    row[mapObj._infoIndex] : null;
                var title = mapObj._titleIndex !== undefined ?
                    row[mapObj._titleIndex] : null;

                mapObj.renderPoint(lat, longVal, title, info, row[mapObj._idIndex]);

                return true;
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

    var getColumns = function(mapObj, view)
    {
        if (view.displayFormat === undefined ||
            (view.displayFormat.plot === undefined &&
             view.displayFormat.latitudeId === undefined))
        { return false; }

        mapObj._infoIsRich = false;
        var colFormat = view.displayFormat.plot || view.displayFormat;
        _.each(view.columns, function(c, i)
        {
            if (c.dataTypeName == 'meta_data' && c.name == 'sid')
            { mapObj._idIndex = i; }

            if (c.tableColumnId == colFormat.latitudeId || c.id == colFormat.ycol)
            { mapObj._latIndex = i; }
            if (c.tableColumnId == colFormat.longitudeId || c.id == colFormat.xcol)
            { mapObj._longIndex = i; }

            if (c.tableColumnId == colFormat.titleId || c.id == colFormat.titleCol)
            { mapObj._titleIndex = i; }
            if (c.tableColumnId == colFormat.descriptionId ||
                c.id == colFormat.bodyCol)
            {
                mapObj._infoIndex = i;
                mapObj._infoIsRich = c.renderTypeName == "text" &&
                    c.format !== undefined &&
                    c.format.formatting_option == "Rich";
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
        mapObj._infoIsRich = false;
        if (cols.length > 2)
        {
            var infoCol = cols[2];
            mapObj._infoIndex = infoCol.dataIndex;
            mapObj._infoIsRich = infoCol.renderTypeName == "text" &&
                infoCol.format !== undefined &&
                infoCol.format.formatting_option == "Rich";
        }
        return true;
    };

})(jQuery);
