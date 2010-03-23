(function($)
{
    // Set up namespace for editors to class themselves under
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
            var mapClass = $.socrataMap[options.displayFormat.type];
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

    $.extend(socrataMapObj,
    {
        defaults:
        {
            pageSize: 100
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("socrataMap", currentObj);

                currentObj._displayConfig = currentObj.settings.displayFormat || {};

                currentObj._rowsLeft = 0;
                currentObj._rowsLoaded = 0;
                currentObj._markers = {};

                currentObj.initializeMap();

                $domObj.resize(function(e) { currentObj.resizeHandle(e); });

                $domObj.parent().append('<div class="loadingSpinnerContainer">' +
                    '<div class="loadingSpinner"></div></div>');
                $domObj.before('<div id="mapError" class="mainError"></div>');
                $domObj.prev('#mapError').hide();

                loadRows(currentObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: currentObj.settings.pageSize});
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            reload: function()
            {
                var mapObj = this;
                mapObj.$dom().prev('#mapError').hide().text('');

                if (mapObj.infoWindow !== undefined) { mapObj.infoWindow.close(); }
                _.each(mapObj._markers, function(m) { m.setMap(null); });
                mapObj._bounds = new google.maps.LatLngBounds();

                mapObj._markers = {};
                mapObj._rowsLeft = 0;
                mapObj._rowsLoaded = 0;

                loadRows(mapObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: mapObj.settings.pageSize});
            },

            showError: function(errorMessage)
            {
                this.$dom().prev('#mapError').show().text(errorMessage);
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

            handleRowsLoaded: function(rows)
            {
                // Override if you need extra handling before rendering
                this.renderData(rows);
            },

            renderData: function(rows)
            {
                var mapObj = this;
                if (mapObj._latIndex === undefined ||
                    mapObj._longIndex === undefined)
                { return; }

                var addedMarkers = false;
                var badPoints = false;
                _.each(rows, function(r)
                {
                    var lat = r[mapObj._latIndex];
                    var longVal = r[mapObj._longIndex];
                    if (lat === null || longVal === null) { return; }
                    if (lat < -90 || lat > 90 || longVal < -180 || longVal > 180)
                    {
                        badPoints = true;
                        return;
                    }
                    var info = mapObj._infoIndex !== undefined ?
                        r[mapObj._infoIndex] : null;
                    var title = mapObj._titleIndex !== undefined ?
                            r[mapObj._titleIndex] : null;

                    mapObj.renderPoint(lat, longVal, title, info,
                        r[mapObj._idIndex]);

                    addedMarkers = true;
                });

                if (badPoints)
                {
                    mapObj.showError('Some points were invalid. ' +
                            'Latitude must be between -90 and 90, and longitude ' +
                            'must be between -180 and 180');
                }

                if (addedMarkers)
                { mapObj.adjustBounds(); }
            },

            renderPoint: function(latVal, longVal, title, info, rowId)
            {
                // Implement me
            },

            adjustBounds: function()
            {
                // Implement if desired to adjust map bounds after data is rendered
            },

            resizeHandle: function(event)
            {
                // Implement if you need to do anything on resize
            }
        }
    });

    var loadRows = function(mapObj, args)
    {
        mapObj.$dom().parent().find('.loadingSpinnerContainer')
            .removeClass('hidden');
        $.ajax({url: '/views/' + blist.display.viewId + '/rows.json',
                data: args, type: 'GET', dataType: 'json',
                complete: function()
                    { mapObj.$dom().parent().find('.loadingSpinnerContainer')
                        .addClass('hidden'); },
                success: function(data) { rowsLoaded(mapObj, data); }});
    };

    var rowsLoaded = function(mapObj, data)
    {
        if (data.meta !== undefined)
        {
            if (!getColumns(mapObj, data.meta.view))
            { getLegacyColumns(mapObj, data.meta.view); }
            mapObj._rowsLeft = data.meta.totalRows - mapObj._rowsLoaded;
        }

        var rows = data.data.data || data.data;
        mapObj._rowsLoaded += rows.length;
        mapObj._rowsLeft -= rows.length;
        loadMoreRows(mapObj);

        mapObj.handleRowsLoaded(rows);
    };

    var loadMoreRows = function(mapObj)
    {
        if (mapObj._rowsLeft < 1) { return; }

        var toLoad = Math.min(mapObj._rowsLeft, mapObj.settings.pageSize);

        loadRows(mapObj, { method: 'getByIds', start: mapObj._rowsLoaded,
            length: toLoad });
    };

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
