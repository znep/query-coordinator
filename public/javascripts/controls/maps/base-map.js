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
            var mapService = options.view.displayFormat.type || 'google';
            var plotStyle = options.view.displayFormat.plotStyle;
            if (mapService == 'heatmap')
            {
                mapService = 'esri';
                plotStyle  = 'heatmap';
            }
            if (options.view.isArcGISDataset())
            { mapService = 'esri'; }

            var mapClass = $.socrataMap[mapService];
            if (!$.isBlank(mapClass))
            {
                if (plotStyle && $.socrataMap.mixin[plotStyle])
                { mapClass = $.mixin(mapClass, $.socrataMap.mixin[plotStyle]); }
                if (mapService == 'esri')
                { mapClass = $.mixin(mapClass, $.socrataMap.mixin.arcGISmap); }
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
                mapObj._segments = {};
                mapObj._numSegments = 6;

                if (mapObj.$dom().siblings('#mapLayers').length < 1)
                {
                    mapObj.$dom()
                        .before('<div id="mapLayers" class="commonForm hide">' +
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

                mapObj.initializeFlyouts((mapObj.settings.view.displayFormat
                    .plot || {}).descriptionColumns);

                mapObj.initializeMap();

                mapObj.populateLayers();

                $.live('.mapInfoContainer .infoPaging a', 'click', function(event)
                {
                    event.preventDefault();

                    var $a = $(this);
                    if ($a.hasClass('disabled')) { return; }

                    var $paging = $a.parent();
                    var action = $.hashHref($a.attr('href')).toLowerCase();

                    var $rows = $paging.siblings('.row');
                    var $curRow = $rows.filter(':visible');

                    var newIndex = $curRow.index() + (action == 'next' ? 1 : -1);
                    if (newIndex < 0) { return; }
                    if (newIndex >= $rows.length) { return; }

                    $curRow.addClass('hide');
                    $rows.eq(newIndex).removeClass('hide');

                    $paging.find('a').removeClass('disabled');
                    if (newIndex <= 0)
                    { $paging.find('.previous').addClass('disabled'); }
                    if (newIndex >= $rows.length - 1)
                    { $paging.find('.next').addClass('disabled'); }
                });

                mapObj._origData = {
                    displayFormat: mapObj.settings.view.displayFormat,
                    mapType: mapObj.settings.view.displayFormat.type,
                    plotStyle: mapObj.settings.view.displayFormat.plotStyle,
                    layers: mapObj.settings.view.displayFormat.layers};

                mapObj.ready();
            },

            columnsLoaded: function()
            {
                var mapObj = this;
                if (mapObj._byView[mapObj.settings.view.id]._colorValueCol)
                {
                    if (!mapObj._gradient)
                    {
                        mapObj._gradient = $.gradient(mapObj._numSegments,
                                mapObj.settings.view.displayFormat.color ||
                                "#0000ff");
                    }

                    mapObj.$legend({
                        name: mapObj._byView[mapObj.settings.view.id]
                            ._colorValueCol.name,
                        gradient: _.map(mapObj._gradient,
                              function(c) { return "#"+$.rgbToHex(c); }
                    )});
                }
            },

            noReload: function()
            {
                var mapObj = this;
                var oldDF = $.extend({}, mapObj._origData.displayFormat);
                var newDF = $.extend({}, mapObj.settings.view.displayFormat);
                _.each(['viewport'], function(property)
                { delete oldDF[property]; delete newDF[property]; });

                return _.isEqual(oldDF, newDF);
            },

            reloadSpecialCases: function()
            {
                var mapObj = this;
                if (!_.isEqual(mapObj._origData.displayFormat.viewport,
                               mapObj.settings.view.displayFormat.viewport))
                { mapObj.setViewport(mapObj.settings.view.displayFormat.viewport); }
            },

            reset: function()
            {
                var mapObj = this;
                $(mapObj.currentDom).removeData('socrataVisualization');
                mapObj.$dom().empty();
                if (mapObj._legend) { mapObj._legend.$dom.hide(); }
                // We need to change the ID so that maps (such as ESRI) recognize
                // something has changed, and reload properly
                mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
                $(mapObj.currentDom).socrataMap(mapObj.settings);
            },

            needsPageRefresh: function()
            {
                var od = this._origData || {};
                var view = this.settings.view;
                return od.mapType != view.displayFormat.type &&
                    od.mapType == 'bing';
            },

            needsFullReset: function()
            {
                var od = this._origData || {};
                var view = this.settings.view;
                return view.displayFormat.type != od.mapType ||
                    view.displayFormat.plotStyle != od.plotStyle ||
                    !_.isEqual(view.displayFormat.layers,
                            od.layers);
            },

            reloadVisualization: function()
            {
                var mapObj = this;
                mapObj.$dom().siblings('#mapLayers').addClass('hide');

                mapObj.resetData();
                mapObj.resetMixinData();
                mapObj.populateLayers();

                mapObj._markers = {};
                mapObj._gradient = undefined;
                mapObj._segmentColors = undefined;

                _.each(mapObj._byView, function(viewConfig)
                {
                    viewConfig._llKeys = {};
                    viewConfig._locCol = undefined;
                    viewConfig._latCol = undefined;
                    viewConfig._longCol = undefined;
                    viewConfig._quantityCol = undefined;
                });

                mapObj.initializeFlyouts((mapObj.settings.view.displayFormat
                    .plot || {}).descriptionColumns);

                mapObj._origData = {
                    displayFormat: mapObj.settings.view.displayFormat,
                    mapType: mapObj.settings.view.displayFormat.type,
                    plotStyle: mapObj.settings.view.displayFormat.plotStyle,
                    layers: mapObj.settings.view.displayFormat.layers};
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
                    $layersList.append('<li data-layerid="' + l.id + '"' +
                        '><input type="checkbox" id="' + lId +
                        '"' + (l.visible ? ' checked="checked"' : '') +
                        ' /><label for="' + lId + '">' + l.name + '</label><br />' +
                        '<span class="sliderControl" data-min="0" data-max="100" ' +
                        'data-origvalue="' +
                        (mapObj.map.getLayer(l.id).opacity*100) + '" /></li>');
                });
                $layersList.find('.sliderControl').each(function()
                {
                    var $slider = $(this);
                    $slider.slider({min: parseInt($slider.attr('data-min')),
                        max: parseInt($slider.attr('data-max')),
                        value: parseInt($slider.attr('data-origvalue'))});
                    $slider.after($.tag(
                        {tagName: 'input', type: 'text',
                        value: $slider.attr('data-origvalue'),
                        readonly: true, 'class': 'sliderInput'}
                    , true));
                    $slider.bind('slide', function(event, ui)
                    {
                        var $_this = $(this);
                        mapObj.map.getLayer($_this.parent()
                            .attr('data-layerid')).setOpacity(ui.value/100);
                        $_this.next(':input').val(ui.value);
                    });
                });

                var reorderLayers = function(event, ui)
                {
                    var layer = mapObj.map.getLayer(ui.item.attr('data-layerid'));
                    var index = $layersList.find('li').index(ui.item);
                    if (layer)
                    { mapObj.map.reorderLayer(layer, index); }
                };
                $layersList.sortable({containment: 'parent',
                    placeholder: 'ui-state-highlight',
                    forcePlaceholderSize: true, tolerance: 'pointer',
                    update: reorderLayers, cancel: 'a.ui-slider-handle'
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

            resetMixinData: function()
            {
                // Implement if you need to reset any data when the map is reset
            },

            handleRowsLoaded: function(rows, view)
            {
                var mapObj = this;

                if (mapObj._totalRows > mapObj._maxRows)
                {
                    mapObj.showError('This dataset has more than ' + mapObj._maxRows +
                                     ' rows visible. Some points will be not be' +
                                     ' displayed.');
                    // TODO: This may need to be deleted on reset. Investigate.
                    mapObj._maxRowsExceeded = true;
                }

                mapObj.renderData(rows, view);
            },

            generateFlyoutLayout: function(columns)
            {
                var titleId = (this.settings.view.displayFormat.plot || {}).titleId;
                if (_.isEmpty(columns) && $.isBlank(titleId))
                { return null; }
                return this.generateFlyoutLayoutDefault(columns, titleId);
            },

            generateFlyoutLayoutDefault: function(columns, titleId)
            {
                var mapObj = this;

                var col = {rows: []};

                // Title row
                if (!$.isBlank(titleId))
                {
                    col.rows.push({fields: [{type: 'columnData',
                        tableColumnId: titleId}
                    ], styles: {'border-bottom': '1px solid #666666',
                        'font-size': '1.2em', 'font-weight': 'bold',
                        'margin-bottom': '0.75em', 'padding-bottom': '0.2em'}});
                }

                _.each(columns || [], function(dc)
                {
                    var row = {fields: [
                        {type: 'columnLabel', tableColumnId: dc.tableColumnId},
                        {type: 'columnData', tableColumnId: dc.tableColumnId}
                    ]};
                    col.rows.push(row);
                });
                return {columns: [col]};
            },

            getFlyout: function(rows, details, dataView)
            {
                return this.getFlyoutDefault(rows, dataView);
            },

            getFlyoutDefault: function(rows, v)
            {
                var mapObj = this;
                var $info = $.tag({tagName: 'div', 'class': 'mapInfoContainer'});
                _.each(rows, function(r) { $info.append(mapObj.renderFlyout(r, v)); });

                if (rows.length > 1)
                {
                    $info.children('.row').addClass('hide')
                        .first().removeClass('hide');
                    $info.append($.tag({tagName: 'div', 'class': 'infoPaging',
                        contents: [
                            {tagName: 'a', 'class': ['previous', 'disabled'],
                                href: '#Previous', title: 'Previous row',
                                contents: '&lt; Previous'},
                            {tagName: 'a', 'class': 'next', href: '#Next',
                                title: 'Next row', contents: 'Next &gt;'}
                        ]
                    }));
                }

                return $info;
            },

            renderRow: function(row, view)
            {
                var mapObj = this;
                var viewConfig = mapObj._byView[view.id];

                if (mapObj.settings.view.displayFormat.noLocations &&
                    _.isUndefined(row.feature))
                { return true; }

                // A configured Location column always takes precedence.
                // _geoCol is and always will be a fallback.
                var locCol = viewConfig._locCol || viewConfig._geoCol;

                if (_.isUndefined(row.feature) &&
                    _.isUndefined(locCol) &&
                    (_.isUndefined(viewConfig._latCol) ||
                     _.isUndefined(viewConfig._longCol)))
                {
                    mapObj.errorMessage = 'No columns defined';
                    return false;
                }

                var isPoint = true;

                var lat;
                var longVal;
                if (!_.isUndefined(row.feature))
                {
                    var loc = row.feature.geometry;
                    if (_.include([102100,102113,3857], loc.spatialReference.wkid))
                    { loc = esri.geometry.webMercatorToGeographic(loc); }

                    if (loc.type != 'point')
                    { isPoint = false; }
                    else
                    {
                        lat = loc.y;
                        longVal = loc.x;
                    }
                }
                else if (!$.isBlank(locCol))
                {
                    var loc = row[locCol.id];
                    if ($.isBlank(loc)) { return true; }

                    if (loc.geometry && (loc.geometry.rings || loc.geometry.paths))
                    { isPoint = false; }
                    else
                    {
                        lat = parseFloat(loc.latitude);
                        longVal = parseFloat(loc.longitude);
                    }
                }
                else
                {
                    lat = parseFloat(row[viewConfig._latCol.id]);
                    longVal = parseFloat(row[viewConfig._longCol.id]);
                }

                // Incomplete points will be safely ignored
                if (isPoint &&
                    _.isNull(lat) || _.isNaN(lat) ||
                    _.isNull(longVal) || _.isNaN(longVal)) { return true; }
                if (lat <= -90 || lat >= 90 || longVal <= -180 || longVal >= 180)
                {
                    mapObj.errorMessage = 'Latitude must be between -90 and 90, ' +
                        'and longitude must be between -180 and 180';
                    return false;
                }

                if (!viewConfig._llKeys) viewConfig._llKeys = {};
                if (isPoint)
                {
                    var rowKey = lat.toString();
                    rowKey    += ',';
                    rowKey    += longVal.toString();
                }
                else if (row.feature)
                { rowKey = row.feature.attributes[viewConfig._objectIdKey]; }
                else
                { rowKey = view.id + row.id; } // too difficult to identify duplicates

                if (!viewConfig._llKeys[rowKey])
                { viewConfig._llKeys[rowKey] = { rows: [] }; }

                if (!_.any(viewConfig._llKeys[rowKey].rows, function(cachedRow)
                    { return row.id == cachedRow.id; }))
                { viewConfig._llKeys[rowKey].rows.push(row); }

                var details = {rows: viewConfig._llKeys[rowKey].rows};
                if (viewConfig._iconCol && row[viewConfig._iconCol.id])
                {
                    var icon;
                    if (viewConfig._iconCol.dataTypeName == 'url')
                    {
                        icon = row[viewConfig._iconCol.id].url;
                    }
                    else
                    {
                        icon = viewConfig._iconCol.baseUrl()
                            + row[viewConfig._iconCol.id];
                    }
                    if (icon) { details.icon = icon; }
                }
                if (viewConfig._sizeValueCol
                    && mapObj._segments[viewConfig._sizeValueCol.id])
                {
                    for (var i = 0; i < mapObj._numSegments; i++)
                    {
                        if (parseFloat(row[viewConfig._sizeValueCol.id]) <=
                            mapObj._segments[viewConfig._sizeValueCol.id][i])
                        { details.size  = 10+(6*i); break; }
                    }
                }
                if (mapObj.settings.view.displayFormat.color)
                {
                    var rgb = $.hexToRgb(mapObj.settings.view.displayFormat.color);
                    details.color = [ rgb.r, rgb.g, rgb.b ];
                }
                if (viewConfig._colorValueCol
                    && mapObj._segments[viewConfig._colorValueCol.id])
                {
                    for (var i = 0; i < mapObj._numSegments; i++)
                    {
                        if (parseFloat(row[viewConfig._colorValueCol.id]) <=
                            mapObj._segments[viewConfig._colorValueCol.id][i])
                        {
                            var rgb = mapObj._gradient[i];
                            details.color = [ rgb.r, rgb.g, rgb.b ];
                            break;
                        }
                    }
                }

                if (row.color)
                { details.color = row.color; }

                if (row.meta)
                {
                    var mapping = { 'mapIcon': 'icon',
                        'pinSize': 'size', 'pinColor': 'color' };
                    _.each(_.keys(mapping), function(key)
                    {
                        if (row.meta[key])
                        { details[mapping[key]] = row.meta[key]; }
                    });
                }

                var geoType = (function() {
                    if (row.feature)
                    { return row.feature.geometry.type; }

                    var geometry = row[locCol.id].geometry;
                    if (geometry)
                    {
                        if (geometry.rings)
                        { return 'polygon'; }
                        else if (geometry.paths)
                        { return 'polyline'; }
                    }

                    return 'point';
                })();

                var geometry;
                switch (geoType)
                {
                    case 'point':
                        geometry = { latitude: lat, longitude: longVal };
                        break;
                    case 'polygon':
                        geometry = { rings: row[locCol.id].geometry.rings };
                        break;
                    case 'polyline':
                        geometry = { paths: row[locCol.id].geometry.paths };
                        break;
                }

                details.dataView = view;

                return mapObj.renderGeometry(geoType, geometry, rowKey, details);
            },

            renderGeometry: function(geoType, geometry, dupKey, details)
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

            getViewport: function(with_bounds)
            {
                // Implement me
            },

            setViewport: function(viewport)
            {
                // Implement me
            },

            updateRowsByViewport: function(viewport, wrapIDL)
            {
                var mapObj = this;
                if (!mapObj._maxRowsExceeded) { return; }
                if (!viewport) { viewport = mapObj.getViewport(true); }

                _.each(mapObj._dataViews, function(view)
                {
                    var viewConfig = mapObj._byView[view.id];
                    var filterColumn = viewConfig._geoCol || viewConfig._locCol;

                    var buildFilterCondition = function(viewport)
                    {
                        return { type: 'operator', value: 'AND',
                            children: _.flatten(_.map(['x', 'y'], function(axis)
                            {
                                return _.map(['min', 'max'], function(bound)
                                {
                                    var condition = { type: 'operator' };
                                    condition.value = (bound == 'min')
                                                            ? 'GREATER_THAN'
                                                            : 'LESS_THAN';
                                    condition.children = [
                                        {
                                            type: 'column',
                                            value: (axis == 'x') ? 'LONGITUDE'
                                                                 : 'LATITUDE',
                                            columnId: filterColumn.id
                                        },
                                        {
                                            type: 'literal',
                                            value: Math[bound].apply(null,
                                                [viewport[axis+'min'],
                                                 viewport[axis+'max']])
                                        }
                                    ];
                                    return condition;
                                });
                            }))
                        };
                    };

                    var query = $.extend(true, {}, view.query);
                    var filterCondition = {temporary: true, displayTypes: ['map']};
                    if (!wrapIDL || viewport.xmin < viewport.xmax)
                    {
                        filterCondition = $.extend(filterCondition,
                            buildFilterCondition(viewport));
                    }
                    else
                    {
                        var rightHemi, leftHemi;
                        rightHemi = $.extend({}, viewport, { xmin: -180 });
                        leftHemi  = $.extend({}, viewport, { xmax:  180 });
                        filterCondition = $.extend(filterCondition,
                            { type: 'operator', value: 'OR',
                            children: _.map([leftHemi, rightHemi], function(hemi)
                                { return buildFilterCondition(hemi); }) });
                    }

                    if ((query.namedFilters || {}).viewport)
                    { delete query.namedFilters.viewport; }
                    query.namedFilters = $.extend(true, query.namedFilters || {},
                        { viewport: filterCondition });
                    view.update({ query: query}, false, true);
                });
            },

            resizeHandle: function(event)
            {
                // Implement if you need to do anything on resize
            },

            getColumns: function()
            {
                var mapObj = this;
                var view = mapObj.settings.view;

                _.each(mapObj._dataViews, function(view)
                {
                    var viewConfig = mapObj._byView[view.id];

                    // For updateColumnsByViewport to filter on geometries.
                    viewConfig._geoCol = _.detect(view.realColumns, function(col)
                        { return _.include(['geospatial', 'location'],
                                           col.renderTypeName); });

                    viewConfig._objectIdCol = _.detect(view.realColumns, function(col)
                        { return col.name.toUpperCase() == 'OBJECTID'; });
                    viewConfig._objectIdKey = (viewConfig._objectIdCol || {}).name;

                    if (!$.subKeyDefined(view.displayFormat, 'plot'))
                    { return; }

                    // Preferred location column
                    if (!$.isBlank(view.displayFormat.plot.locationId))
                    { viewConfig._locCol =
                        view.columnForTCID(view.displayFormat.plot.locationId); }

                    viewConfig._redirectCol =
                        view.columnForTCID(view.displayFormat.plot.redirectId);

                    viewConfig._iconCol =
                        view.columnForTCID(view.displayFormat.plot.iconId);

                    var aggs = {};
                    _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
                    {
                        var c = view.columnForTCID(
                            view.displayFormat.plot[colName + 'Id']);
                        if (!$.isBlank(c))
                        {
                            viewConfig['_' + colName + 'Col'] = c;
                            aggs[c.id] = ['maximum', 'minimum'];
                        }
                    });

                    if (!_.isEmpty(aggs))
                    {
                        if (!view._delayRenderData) { view._delayRenderData = 0; }
                        view._delayRenderData++;

                        view.getAggregates(function()
                        { calculateSegmentSizes(mapObj, aggs); }, aggs);
                    }
                });

                return true;
            },

            $legend: function(options)
            {
                var mapObj = this;
                if (options == null) { return mapObj._legend; }

                var SWATCH_WIDTH = 17;

                if (!mapObj._legend)
                { mapObj._legend = { minimum: '', maximum: '' }; }

                if (!mapObj.$dom().siblings('#mapLegend').length)
                {
                    mapObj.$dom().before('<div id="mapLegend">' +
                        '<div class="contentBlock">' +
                        '<h3></h3><div style="width: ' +
                        (mapObj._numSegments*SWATCH_WIDTH) +
                        'px;"><ul></ul><span>' +
                        mapObj._legend.minimum + '</span>' +
                        '<span style="float: right;">' +
                        mapObj._legend.maximum + '</span></div>' +
                        '</div></div>');
                }
                if (!mapObj._legend.$dom)
                { mapObj._legend.$dom = $('#mapLegend').hide(); }

                if (options.name)
                { mapObj._legend.$dom.find('h3').text(options.name); }

                if (options.gradient)
                {
                    var $ul = mapObj._legend.$dom.find('ul');
                    $ul.empty();
                    _.each(options.gradient, function(color)
                        {
                            $ul.append( $("<div class='color_swatch'>" +
                                "<div class='inner'>&nbsp;</div></div>")
                                    .css('background-color', color)
                                );
                        }
                    );
                    mapObj._legend.gradientSet = true;
                }

                if (!$.isBlank(options.minimum))
                {
                    mapObj._legend.minimum = options.minimum;
                    if (mapObj._legend.$dom)
                    { mapObj._legend.$dom.find('span:first').text(options.minimum); }
                }
                if (!$.isBlank(options.maximum))
                {
                    mapObj._legend.maximum = options.maximum;
                    if (mapObj._legend.$dom)
                    { mapObj._legend.$dom.find('span:last').text(options.maximum); }
                }

                if (mapObj._legend.gradientSet)
                { mapObj._legend.$dom.show(); }
            }
        }
    }));

    var calculateSegmentSizes = function(mapObj, aggs)
    {
        _.each(aggs, function(a, cId)
        {
            var column = mapObj.settings.view.columnForID(cId);
            var difference = column.aggregates.maximum - column.aggregates.minimum;
            var granularity = difference / mapObj._numSegments;

            mapObj._segments[column.id] = [];
            for (i = 0; i < mapObj._numSegments; i++)
            {
                mapObj._segments[column.id][i] =
                    ((i+1)*granularity) + column.aggregates.minimum;
            }

            mapObj.$legend({
                minimum: column.aggregates.minimum,
                maximum: column.aggregates.maximum
            });
        });

        mapObj._delayRenderData--;
        if (!mapObj._delayRenderData && mapObj._delayedRenderData)
        {
            _.each(mapObj._delayedRenderData, function(f) { f(); });
            mapObj._delayedRenderData = [];
        }
    };

})(jQuery);
