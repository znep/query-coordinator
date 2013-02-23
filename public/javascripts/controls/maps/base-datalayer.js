(function($)
{
    $.Control.extend('socrataDataLayer', {
        _getMixins: function(options)
        {
            var mixins = [];
            var df = options.displayFormat || options.view.displayFormat;

            if (options.view.isGeoDataset())
            { mixins = ['mondara']; }
            else if (options.view.isArcGISDataset())
            { mixins = ['arcgis']; }
            else if (df.plotStyle == 'heatmap')
            { mixins = ['boundary']; }
            else if (df.plotStyle == 'rastermap')
            { mixins = ['heatmap']; }
            else if (df.plotStyle == 'point')
            { mixins = ['clusters']; }

            return mixins;
        },

        _init: function()
        {
            var currentObj = this;
            currentObj._super.apply(currentObj, arguments);

            currentObj._uniqueId = _.uniqueId();
            currentObj._view = currentObj.settings.view;
            currentObj._parent = currentObj.settings.parentViz;
            currentObj._index = currentObj.settings.index;
            currentObj._map = currentObj._parent.map;
            currentObj._displayFormat = currentObj.settings.displayFormat
                || currentObj._view.displayFormat;
            currentObj._query = currentObj.settings.query || currentObj._view.query || {};

            if ($.subKeyDefined(currentObj, '_displayFormat.component'))
            { currentObj._displayFormat.component.setDataObj(this); }

            if ($.subKeyDefined(blist, 'datasetPage.sidebar') && currentObj._index == 0
                && $.subKeyDefined(currentObj._view, 'metadata.filterCondition.children'))
            { blist.datasetPage.sidebar.setDefault('filter.unifiedFilter'); }

            currentObj._mapProjection = currentObj._map.getProjectionObject();

            currentObj.initializeColumns();
            currentObj.initializeLayer();
            currentObj.initializeFlyouts();
        },

        destroy: function()
        {
            var layerObj = this;

            layerObj.$dom().remove();
            if (layerObj._$flyoutTemplate)
            { layerObj._$flyoutTemplate.remove(); }

            layerObj._view.unbind(null, null, layerObj);
            if (layerObj._parent._primaryView)
            { layerObj._view.unbind(null, null, layerObj._parent._primaryView); }
        },

        ready: function()
        {
            return this._dataLoaded;
        },

        bindDatasetEvents: function()
        {
            var layerObj = this;

            if (layerObj._eventsBound) { return; }

            layerObj._eventsBound = {
                'row_change': function(rows, fr) { layerObj.handleRowChange(rows, fr); },
                'displayformat_change': function(df) { layerObj.handleDisplayFormatChange(df); },
                'query_change': function() { layerObj.handleQueryChange(); },
                'set_temporary': function() { layerObj.fireTemporaryEvent(true); },
                'clear_temporary': function() { layerObj.fireTemporaryEvent(false); }
            };

            _.each(layerObj._eventsBound, function(handler, eventName)
            { layerObj._view.bind(eventName, handler, layerObj); });
        },

        fireTemporaryEvent: function(set)
        {
            if (this._ignoreTemporary) { delete this._ignoreTemporary; return; }

            var eventName = set ? 'set_temporary' : 'clear_temporary';
            if (this._parent._primaryView && this._parent._primaryView != this._view)
            { this._parent._primaryView.trigger(eventName); }
        },

        clearTemporary: function()
        {
            if (this._parent._primaryView && this._view != this._parent._primaryView)
            {
                this._ignoreTemporary = true;
                this._view._clearTemporary();
                delete this._ignoreTemporary;
            }
        },

        handleDisplayFormatChange: function(newDF)
        {
            var layerObj = this;

            //console.log('handleDisplayFormatChange');
            //console.dir(newDF);

            // When the view is the same as the parent, bad things happen on triggering DF_change.
            if (_.isUndefined(newDF)) { return; }

            if (newDF.component)
            { newDF.component.setDataObj(layerObj); }

            // If it's a legacy dataset, there is a phantom DF change from loading the meta.
            if (!layerObj.ready()) { return; }
            var comparator = function(keystring)
                { return !$.isSubKeyEqual(layerObj._displayFormat, newDF, keystring); };

            var changes = [];
            _.each(layerObj.discoverDisplayFormatChanges(), function(def, key)
            {
                if (_.any(def.keys, comparator))
                {
                    changes.push({ callback: def.onChange,
                                   args: def.args,
                                   scope: def.scope || layerObj
                    });
                }
            });

            layerObj._displayFormat = newDF;
            layerObj.resetColumns();
            layerObj.initializeColumns();
            _.each(changes, function(c) { c.callback.apply(c.scope, [c.args]); });
        },

        discoverDisplayFormatChanges: function()
        {
            return {
                flyouts: { keys: ['flyoutsNoLabel', 'plot.titleId', 'plot.descriptionColumns'],
                           onChange: this.reloadFlyouts }
            };
        },

        handleQueryChange: function()
        {
            var layerObj = this;
//console.log('query change', layerObj._uniqueId);
            this._parent.saveQuery(this._view.id,
                { filterCondition: this._view.cleanFilters(true) });
            layerObj.clearData();
            layerObj.getData();
        },

        handleRowChange: function(rows, fullReset)
        {
            var layerObj = this;
//console.log('row change', layerObj._displayLayer.id, _.size(rows));

            if (fullReset) { return; } // This is because row_change(fullReset: true) appears
                                       // to duplicate sending data down the pipe. Ref: Bug 7577.
            var removedRows = [];
            rows = _.reject(rows, function(r)
            {
                if ($.isBlank(layerObj._view.rowForID(r.id)))
                {
                    if (!_.isEmpty(r)) { removedRows.push(r); }
                    return true;
                }
                return false;
            });
            if (rows.length > 0)
            { layerObj.handleDataLoaded(rows); }
            if (removedRows.length > 0)
            { layerObj.handleDataRemoved(removedRows); }
        },

        initializeColumns: function()
        {
            var layerObj = this;
            var view = layerObj._view;

            // For updateColumnsByViewport to filter on geometries.
            layerObj._geoCol = _.detect(view.realColumns, function(col)
                { return _.include(['geospatial', 'location'],
                                   col.renderTypeName); });

            layerObj._objectIdCol = _.detect(view.realColumns, function(col)
                { return col.name.toUpperCase() == 'OBJECTID'; });
            layerObj._objectIdKey = (layerObj._objectIdCol || {}).name;

            if (!$.subKeyDefined(layerObj._displayFormat, 'plot'))
            { return; }

            // Preferred location column
            if (!$.isBlank(layerObj._displayFormat.plot.locationId))
            { layerObj._locCol =
                view.columnForIdentifier(layerObj._displayFormat.plot.locationId); }

            layerObj._redirectCol =
                view.columnForIdentifier(layerObj._displayFormat.plot.redirectId);

            layerObj._iconCol =
                view.columnForIdentifier(layerObj._displayFormat.plot.iconId);

            var aggs = {};
            _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
            {
                var c = view.columnForIdentifier(
                    layerObj._displayFormat.plot[colName + 'Id']);
                if (!$.isBlank(c))
                {
                    layerObj['_' + colName + 'Col'] = c;
                    aggs[c.id] = ['maximum', 'minimum'];
                    if (colName == 'quantity')
                    { aggs[c.id].push('sum'); }
                }
            });

            if (!_.isEmpty(aggs))
            {
                var gradient = _.map($.gradient(layerObj.settings.numSegments,
                                                layerObj._displayFormat.color || '#0000ff'),
                        function(c) { return '#'+$.rgbToHex(c); });

                // TODO: Figure out how to push this up to map-wrapper, and then back down.
                // (Performance concern)
                view.getAggregates(function()
                {
                    _.each(aggs, function(a, cId)
                    {
                        var column = layerObj._view.columnForIdentifier(cId);
                        var difference = column.aggregates.maximum - column.aggregates.minimum;
                        var granularity = difference / layerObj.settings.numSegments;

                        if (!layerObj._segments) { layerObj._segments = {}; }
                        layerObj._segments[column.id] = [];
                        for (i = 0; i < layerObj.settings.numSegments; i++)
                        {
                            layerObj._segments[column.id][i] = {
                                value: ((i+1)*granularity) + column.aggregates.minimum,
                                color: gradient[i],
                                size: i + 1
                            };
                        }

                        if (layerObj._colorValueCol == column)
                        { layerObj._colorSpread = { min: column.aggregates.minimum,
                                                    max: column.aggregates.maximum }; }
                    });

                    // Refresh the data now that we have aggregates.
                    // TODO: This feels like a really bad way to do this.
                    if (layerObj.ready())
                    {
                        layerObj.handleDataLoaded(layerObj._view.loadedRows());
                        layerObj._parent._controls.Overview.redraw();
                    }
                }, aggs);
            }
        },

        resetColumns: function()
        {
            var layerObj = this;

            _.each(['_locCol', '_geoCol', '_latCol', '_longCol', '_iconCol', '_quantityCol',
                    '_sizeValueCol', '_colorValueCol', '_redirectCol'], function(prop)
            { delete layerObj[prop]; });
        },

        /* Flyout functions */
        initializeFlyouts: function()
        {
            var layerObj = this;
            var viewId = this._view.id;
            var hasFlyout;

            if (!layerObj._$flyoutTemplate)
            {
                layerObj._$flyoutTemplate = layerObj._parent.$dom()
                    .siblings('.flyoutRenderer.template[data-layerId="' + layerObj._uniqueId + '"]');
                if (layerObj._$flyoutTemplate.length < 1)
                {
                    layerObj.$dom().after($.tag({tagName: 'div', 'data-layerId': layerObj._uniqueId,
                        'class': ['template', 'row',
                            'richRendererContainer', 'flyoutRenderer'] }));
                    layerObj._$flyoutTemplate = layerObj.$dom()
                        .siblings('.flyoutRenderer.template[data-layerId="' + layerObj._uniqueId +
                            '"]');
                }
                layerObj.richRenderer = layerObj._$flyoutTemplate.richRenderer({
                    columnCount: 1, view: layerObj._view });
                layerObj.richRenderer.setConfig(hasFlyout = layerObj.generateFlyoutLayout());
                if (hasFlyout) { layerObj.richRenderer.renderLayout(); }
            }
        },

        generateFlyoutLayout: function()
        {
            var layerObj = this;
            var titleId = (layerObj._displayFormat.plot || {}).titleId;
            var columns = (layerObj._displayFormat.plot || {}).descriptionColumns;
            if (_.isEmpty(columns) && $.isBlank(titleId))
            { return null; }

            var layout = layerObj._parent.generateFlyoutLayout(columns,
                layerObj._displayFormat.flyoutsNoLabel);
            if ($.isBlank(layout))
            { layout = {columns: [{rows: []}]}; }
            var col = layout.columns[0];

            // Title row
            if (!$.isBlank(titleId))
            {
                col.rows.unshift({fields: [{type: 'columnData',
                    tableColumnId: titleId}
                ], styles: {'border-bottom': '1px solid #666666',
                    'font-size': '1.2em', 'font-weight': 'bold',
                    'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
            }

            return layout;
        },

        getFlyout: function(rows)
        {
            if (!rows || rows.length < 1) { return null; }

            var layerObj = this;
            var $info = $.tag({tagName: 'div', 'class': 'mapInfoContainer'});
            _.each(rows,
                function(r) { $info.append(layerObj.renderFlyout(r)); });

            if (rows.length > 1)
            { this.addInfoPagingToFlyout($info); }

            // TODO: Update to use address when geolocating.
            if (!layerObj._locCol) { return $info; }
            var loc = rows[0][layerObj._locCol.lookup];

            var mapLinkQuery;
            if (loc.human_address)
            {
                var address = JSON.parse(loc.human_address);
                mapLinkQuery = _.compact(_.values(address)).join(', ');
            }
            else if (loc.latitude && loc.longitude)
            { mapLinkQuery = [loc.latitude, ',', loc.longitude].join(''); }

            if (!_.isEmpty(mapLinkQuery))
            {
                if (layerObj._map.baseLayer instanceof OpenLayers.Layer.Bing)
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://www.bing.com/maps/?where1='+mapLinkQuery,
                    target: '_blank', contents: 'View in Bing Maps'})); }
                else
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://maps.google.com/maps?q='+mapLinkQuery,
                    target: '_blank', contents: 'View in Google Maps'})); }
            }

            return $info;
        },

        addInfoPagingToFlyout: function($flyout)
        {
            $flyout.children('.row').addClass('hide')
                .first().removeClass('hide');
            $flyout.append($.tag({tagName: 'div', 'class': 'infoPaging',
                contents: [
                    {tagName: 'a', 'class': ['previous', 'disabled'],
                        href: '#Previous', title: 'Previous row',
                        contents: '&lt; Previous'},
                    {tagName: 'a', 'class': 'next', href: '#Next',
                        title: 'Next row', contents: 'Next &gt;'}
                ]
            }));
        },

        renderFlyout: function(row)
        {
            var layerObj = this;
            var $item = layerObj._$flyoutTemplate.clone().removeClass('template');

            layerObj.richRenderer.renderRow($item, row, true);

            if (layerObj.settings.showRowLink && !layerObj._displayFormat.hideRowLink)
            {
                $item.append($.tag({tagName: 'a',
                    href: layerObj._view.url + '/' + row.id,
                    'class': ['viewRow', 'noInterstitial', 'noRedirPrompt'],
                    contents: 'View details for this row'}));
            }
            return $item;
        },

        reloadFlyouts: function()
        {
            var layerObj = this;

            var reload = {
                preProcess: function()
                {
                    layerObj._parent.closePopup();
                    layerObj._$flyoutTemplate.remove();
                    delete layerObj._$flyoutTemplate;
                    delete layerObj.richRenderer;
                    layerObj.initializeFlyouts();
                },
                forEach: function(feature)
                    { feature.attributes.flyout = layerObj.getFlyout(feature.attributes.rows); }
            };
            reload.preProcess();
            _.each(layerObj._displayLayer.features, reload.forEach);
        },

        /* Utility functions */
        selectableFeatureLayers: function()
        {
            return null;
        },

        dataLayers: function()
        {
            return null;
        },

        zoomToPreferred: function()
        {
            if (!this.ready())
            { this._parent.viewportHandler().zoomToPreferred(); }
        },

        preferredExtent: function()
        {
            return new OpenLayers.Bounds();
        },

        restrictPanning: function()
        {
            return false;
        },

        legendData: function()
        {
            var layerObj = this;
            if (!layerObj._colorValueCol || !layerObj._segments) { return; }

            return { name: layerObj._colorValueCol.name,
                minimum:   layerObj._colorSpread.min,
                maximum:   layerObj._colorSpread.max,
                gradient:  layerObj._segments[layerObj._colorValueCol.id]
            };
        },

        layersToRestack: function()
        {
            return [];
        },

        /* Data functions */
        getData: function()
        {
        },

        clearData: function()
        {
        },

        setQuery: function(query)
        {
            this._query = $.extend(true, {}, query);
            this._view.update({ query: $.extend(true, {}, this._view.query, this._query) });
        }
    }, {}, null, false);

    $.Control.registerMixin('points', {
        initializeLayer: function()
        {
            var layerObj = this;

            layerObj._displayLayer = new OpenLayers.Layer.Vector(layerObj._view.name);
            layerObj._map.addLayer(layerObj._displayLayer);
            layerObj._displayLayer.dataObj = layerObj;

            layerObj._highlightColor = layerObj._displayFormat.highlightColor
                || '#' + $.rgbToHex($.colorToObj(
                blist.styles.getReferenceProperty('itemHighlight', 'background-color')));
        },

        destroy: function()
        {
            this._super();
            this._displayLayer.destroy();
        },

        discoverDisplayFormatChanges: function()
        {
            var layerObj = this;

            return $.extend(true, layerObj._super(), {
                rowreload:  { keys: layerObj.displayFormatKeyChanges(),
                           onChange: function()
                            {
                                layerObj.handleDataLoaded(layerObj._view.loadedRows());
                                layerObj._parent._controls.Overview.redraw();
                            } }
            });
        },

        displayFormatKeyChanges: function()
        {
            return ['color', 'plot.locationId', 'plot.iconId', 'plot.colorValueId',
                    'plot.sizeValueId'];
        },

        /* Utility functions */
        selectableFeatureLayers: function()
        {
            if (this._displayLayer instanceof OpenLayers.Layer.Vector)
            { return [this._displayLayer]; }
            else
            { return null; }
        },

        dataLayers: function()
        {
            return this._displayLayer;
        },

        preferredExtent: function()
        {
            return this._displayLayer.getDataExtent();
        },

        /* Eventing functions */
        highlightRows: function()
        {
            var view = this._view, args = arguments;
            _.defer(function() { view.highlightRows.apply(view, args); });
        },

        unhighlightRows: function()
        {
            var view = this._view, args = arguments;
            _.defer(function() { view.unhighlightRows.apply(view, args); });
        },

        clickFeature: function(feature)
        {
            var layerObj = this;

            if ((feature.attributes || {}).redirects_to)
            { window.open(feature.attributes.redirects_to); return; }

            if (!_.isEmpty(feature.attributes.rows))
            {
                layerObj.highlightRows(feature.attributes.rows, 'select');
                layerObj._parent.$dom().trigger('display_row',
                    [{row: _.first(feature.attributes.rows), datasetId: layerObj._view.id}]);
                $(document).trigger(blist.events.DISPLAY_ROW,
                    [[layerObj._view.id, _.first(feature.attributes.rows).id].join('/'), true]);
            }
            layerObj._parent.clearHoverTimer(layerObj._uniqueId + feature.attributes.dupKey);

            if (feature.attributes.flyout)
            {
                var lonlat = layerObj._displayLayer.getLonLatFromViewPortPx(
                    layerObj._parent._lastClickAt);
                layerObj._parent.showPopup(lonlat, feature.attributes.flyout[0].innerHTML,
                { closeBoxCallback: function(evt)
                    {
                        if (!feature.layer)
                        { feature = layerObj._data[feature.attributes.dupKey]; }
                        if (feature && feature.layer)
                        { layerObj.unhighlightRows(feature.attributes.rows, 'select'); }
                    },
                    // Hack for Bug 9280.
                    atPixel: feature.geometry instanceof OpenLayers.Geometry.Polygon
                        ? new OpenLayers.Pixel(layerObj._parent._lastClickAt.x,
                                               layerObj._parent._lastClickAt.y)
                        : false
                });
            }
        },

        overFeature: function(feature)
        {
            this._parent.clearHoverTimer(this._uniqueId + feature.attributes.dupKey);
            this.highlightRows(feature.attributes.rows);
        },

        outFeature: function(feature)
        {
            var self = this;
            this._parent.setHoverTimer(this._uniqueId + feature.attributes.dupKey, function()
            { self.unhighlightRows(feature.attributes.rows); });
        },

        /* Data functions */
        getData: function()
        {
            var layerObj = this;

            layerObj._rowsLoaded = 0;
            var rowsRequested = layerObj._parent.rowsRemaining;

            layerObj._view.getRows(0, rowsRequested,
                function(data) {
                    layerObj._parent.rowsLoaded(layerObj._view.totalRows());

                    layerObj.handleDataLoaded(data);

                    if (Math.min(layerObj._view.totalRows(), rowsRequested)
                        <= _.size(layerObj._view.loadedRows()))
                    {
                        layerObj._dataLoaded = true;
                        layerObj._parent.mapElementLoaded(layerObj._displayLayer);
                    }
                });
        },

        clearData: function()
        {
            this._data = {};
            this._displayLayer.removeAllFeatures();
        },

        handleDataLoaded: function(rows)
        {
            var layerObj = this;
            _(rows).chain()
                .map(function(row) { return layerObj.prepareRowRender(row); }).compact()
                .each(function(datum) { layerObj.renderDatum(datum); });

            layerObj.zoomToPreferred();
        },

        handleDataRemoved: function(rows)
        {
            var layerObj = this;
            _(rows).chain()
                .map(function(row) { return layerObj.mapRowToDatum(row); }).compact()
                .each(function(datum) { layerObj.removeDatum(datum); });

            layerObj.zoomToPreferred();
        },

        prepareRowRender: function(row)
        {
            var geometry = this.extractGeometryFromRow(row);
            if (_.isBoolean(geometry) || _.isString(geometry)) { return null; }

            var data = { icon: this.extractIconFromRow(row) };
            if (!data.icon)
            { data = { color: this.extractColorFromRow(row),
                       size: (this._displayFormat.basePointSize || this.settings.basePointSize)
                            + 2 * this.extractSizeFromRow(row) }; }

            var dupKey;
            if (geometry instanceof OpenLayers.Geometry.Point)
            { dupKey = geometry.toString(); }
            return $.extend(data, { geometry: geometry, dupKey: dupKey, rows: [row] });
        },

        mapRowToDatum: function(row)
        {
            return this.extractGeometryFromRow(row).toString();
        },

        renderDatum: function(datum)
        {
            var layerObj = this;

            if (!layerObj._data) { layerObj._data = {}; }

            var marker, newMarker = true;
            if (layerObj._data[datum.dupKey])
            {
                marker = layerObj._data[datum.dupKey];
                if (!(marker.geometry && marker.geometry.equals(datum.geometry)))
                { marker.geometry = datum.geometry; }
                newMarker = false;
            }
            else
            { marker = new OpenLayers.Feature.Vector(datum.geometry); }

            layerObj.styleDatum(marker, datum);

            marker.attributes.rows = $.makeArray(marker.attributes.rows);
            if (_.isEmpty(_.intersection(marker.attributes.rows, datum.rows)))
            { marker.attributes.rows = marker.attributes.rows.concat(datum.rows); }
            marker.attributes.flyout = layerObj.getFlyout(marker.attributes.rows);

            if (newMarker)
            {
                layerObj._data[datum.dupKey] = marker;
                layerObj._displayLayer.addFeatures([marker]);
            }
            else
            { layerObj._displayLayer.drawFeature(marker); }
        },

        removeDatum: function(datum)
        {
            this._data[datum.dupKey].destroy();
        },

        styleDatum: function(marker, datum)
        {
            var layerObj = this;

            var hasHighlight = _.any(datum.rows, function(r)
                { return r.sessionMeta && r.sessionMeta.highlight; });

            if (datum.icon)
            {
                marker.style = layerObj._parent._controls.IconCache.fetch(
                    datum.icon, marker, hasHighlight);
            }
            else
            {
                marker.style = marker.style || {};
                marker.style.fillColor = hasHighlight ? layerObj._highlightColor
                                                      : datum.color;
                marker.style.strokeColor = '#ffffff';
                marker.style.strokeWidth = 2;
                marker.style.pointRadius = datum.size || 5;
            }
        },

        /* Data extraction functions */
        extractGeometryFromRow: function(row)
        {
            var layerObj = this;

            if (layerObj._displayFormat.noLocations && _.isUndefined(row.feature))
            { return 'do not render locations'; }

            // A configured Location column always takes precedence.
            // _geoCol is and always will be a fallback.
            var locCol = layerObj._locCol || layerObj._geoCol;

            if (_.isUndefined(row.feature) && _.isUndefined(locCol) &&
                (_.isUndefined(layerObj._latCol) || _.isUndefined(layerObj._longCol)))
            {
                layerObj._parent.errorMessage = 'No columns defined';
                return false;
            }

            var point = {isPoint: true};

            var lonlat;
            if (!$.isBlank(locCol))
            {
                var loc = row[locCol.id];
                if ($.isBlank(loc)) { return 'no location'; }

                if (loc.geometry && (loc.geometry.rings || loc.geometry.paths))
                { point.isPoint = false; }
                else
                { lonlat = new OpenLayers.LonLat(parseFloat(loc.longitude),
                                                 parseFloat(loc.latitude)); }
            }
            else
            { lonlat = new OpenLayers.LonLat(parseFloat(row[layerObj._longCol.id]),
                                             parseFloat(row[layerObj._latCol.id])); }

            // Incomplete points will be safely ignored
            if (lonlat && lonlat.isIncomplete()) { return 'lonlat is incomplete'; }
            if (lonlat.lat <= -90 || lonlat.lat >= 90 || lonlat.lon <= -180 || lonlat.lon >= 180)
            {
                layerObj._parent.errorMessage = 'Latitude must be between -90 and 90, ' +
                    'and longitude must be between -180 and 180';
                return false;
            }

            if (point.isPoint)
            {
                lonlat.transform(blist.openLayers.geographicProjection, layerObj._mapProjection);
                return new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            }
            else
            {
                // Currently, we don't actually *render* polyline or polygons from Socrata data.
            }
        },

        extractIconFromRow: function(row)
        {
            var layerObj = this;

            if ($.subKeyDefined(row, 'meta.mapIcon'))
            { return row.meta.mapIcon; }
            else if (row.icon)
            { return row.icon; }
            else if (layerObj._iconCol && row[layerObj._iconCol.id])
            {
                if (layerObj._iconCol.dataTypeName == 'url')
                { return row[layerObj._iconCol.id].url; }
                else
                { return layerObj._iconCol.baseUrl() + row[layerObj._iconCol.id]; }
            }

            return null;
        },

        extractColorFromRow: function(row)
        {
            var layerObj = this;

            if ($.subKeyDefined(row, 'meta.pinColor'))
            { return row.meta.pinColor; }
            else if (row.color)
            { return row.color; }
            else if (layerObj._colorValueCol && layerObj._segments
                && layerObj._segments[layerObj._colorValueCol.id])
            {
                var segment
                    = _.detect(layerObj._segments[layerObj._colorValueCol.id], function(segment)
                    { return parseFloat(row[layerObj._colorValueCol.id]) <= segment.value; });
                if (segment) { return segment.color; }
            }
            return layerObj._displayFormat.color || '#0000ff';
        },

        extractSizeFromRow: function(row)
        {
            var layerObj = this;

            if ($.subKeyDefined(row, 'meta.pinSize'))
            { return row.meta.pinSize; }
            else if (layerObj._sizeValueCol && layerObj._segments
                && layerObj._segments[layerObj._sizeValueCol.id])
            {
                var segment
                    = _.detect(layerObj._segments[layerObj._sizeValueCol.id], function(segment)
                    { return parseFloat(row[layerObj._sizeValueCol.id]) <= segment.value; });
                if (segment) { return segment.size; }
            }
            return 0;
        },

        // Easter egg for some later time.
        heatmapBackground: function()
        {
            var layerObj = this;

            var df = $.extend(true, {}, layerObj._displayFormat, { plotStyle: 'rastermap' });

            layerObj.$dom().append('<div id="' + layerObj.$dom().attr('id') + '-heatBkg"></div>');
            layerObj._heatmapBkg
                = layerObj.$dom().find('div').socrataDataLayer({ view: layerObj._view,
                    index: layerObj._index + 0.5, parentViz: layerObj._parent, displayFormat: df });

            layerObj._heatmapBkg.bindDatasetEvents();
            layerObj._heatmapBkg.getData();
        }
    }, { showRowLink: true, numSegments: 6, basePointSize: 5 },
    'socrataDataLayer');

    $.Control.registerMixin('tiledata', {
    }, {}, 'socrataDataLayer');

})(jQuery);
