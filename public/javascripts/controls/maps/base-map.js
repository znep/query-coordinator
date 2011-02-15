(function($)
{
    var rowsPerPage = 3;

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
                if (options.view.renderWithArcGISServer())
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

                mapObj.initializeMap();

                mapObj.populateLayers();

                $(".infoPaging").live('click', function(event)
                {
                    var params = event.currentTarget.id.split('_');
                    var cmd = params[0];
                    var id = params[1];

                    var rows = $('#info_'+id+' tr:gt(0)');
                    var index = parseInt(rows.filter(':visible:first')
                                             .attr('id').split('_')[2]);

                    var new_index = cmd == 'next' ? index+rowsPerPage
                                                  : index-rowsPerPage;
                    new_index--; // :gt needs one less.
                    if (new_index < -1) return;
                    if (new_index >= rows.length-1) return;

                    rows.filter(':visible').css('display', 'none');
                    var filter = '';
                    if (new_index > -1) { filter += ':gt('+new_index+')'; }
                    filter += ':lt('+rowsPerPage+')';
                    rows.filter(filter).css('display', 'table-row');

                    new_index++; // no longer need to worry about :gt
                    if (new_index-rowsPerPage < -1)
                    {
                        $("#prev_"+id).hide();
                    }
                    else if (new_index+rowsPerPage >= rows.length-1)
                    {
                        $("#next_"+id).hide();
                    }
                    else
                    {
                        $("#prev_"+id+", #next_"+id).show();
                    }
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
                if (mapObj._colorValueCol)
                {
                    if (!mapObj._gradient)
                    {
                        mapObj._gradient = $.gradient(mapObj._numSegments,
                                mapObj.settings.view.displayFormat.color ||
                                "#0000ff");
                    }

                    mapObj.$legend({
                        name: mapObj._colorValueCol.name,
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
                mapObj.populateLayers();

                mapObj._markers = {};
                mapObj._llKeys = {};
                mapObj._rows = [];
                mapObj._gradient = undefined;

                mapObj._locCol = undefined;
                mapObj._latCol = undefined;
                mapObj._longCol = undefined;
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

            handleRowsLoaded: function(rows)
            {
                var mapObj = this;

                if (mapObj._rows === undefined) { mapObj._rows = []; }
                mapObj._rows = mapObj._rows.concat(rows);
                if (mapObj.settings.view.totalRows > mapObj._maxRows)
                {
                    mapObj.showError('This dataset has more than ' + mapObj._maxRows +
                                     ' rows visible. Some points will be not be' +
                                     ' displayed.');
                    // TODO: This may need to be deleted on reset. Investigate.
                    mapObj._maxRowsExceeded = true;
                }

                mapObj.renderData(rows);
            },

            renderRow: function(row)
            {
                var mapObj = this;

                if (mapObj.settings.view.displayFormat.noLocations &&
                    _.isUndefined(row.feature))
                { return true; }

                // A configured Location column always takes precedence.
                // _geoCol is and always will be a fallback.
                var locCol = mapObj._locCol || mapObj._geoCol;

                if (_.isUndefined(row.feature) &&
                    _.isUndefined(locCol) &&
                    (_.isUndefined(mapObj._latCol) ||
                     _.isUndefined(mapObj._longCol)))
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
                    lat = parseFloat(row[mapObj._latCol.id]);
                    longVal = parseFloat(row[mapObj._longCol.id]);
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

                if (!mapObj._llKeys) mapObj._llKeys = {};
                if (isPoint)
                {
                    var rowKey = lat.toString();
                    rowKey    += ',';
                    rowKey    += longVal.toString();
                }
                else if (row.feature)
                { rowKey = row.feature.attributes[mapObj._objectIdKey]; }
                else
                { rowKey = row.id; } // too difficult to identify duplicates

                if (!mapObj._llKeys[rowKey])
                {
                    mapObj._llKeys[rowKey] = { title: [], info: [] };
                    mapObj._llKeys[rowKey].id = row.id;
                }
                mapObj._llKeys[rowKey].title.push(mapObj.getText(row,
                    mapObj._titleCol, true));
                mapObj._llKeys[rowKey].info.push(mapObj.getText(row,
                    mapObj._infoCol, false));

                var title = _.compact(mapObj._llKeys[rowKey].title).join(', ');
                if (title.length > 50) { title = title.slice(0, 50) + "..."; }

                var totalRows = mapObj._llKeys[rowKey].title.length;

                var info;
                if (totalRows > 1 && (mapObj._titleCol || mapObj._infoCol))
                {
                    info  = '<table id="info_'
                    info += mapObj._llKeys[rowKey].id;
                    info += '"><tr><th>';
                    info += (mapObj._titleCol || {}).name || '';
                    info += '</th><th>';
                    info += (mapObj._infoCol || {}).name || '';
                    info += '</th></tr>';
                    for (var i = 0; i < totalRows; i++)
                    {
                        info += '<tr id="infoRow_';
                        info += mapObj._llKeys[rowKey].id;
                        info += '_'+i+'" ';
                        if (i > rowsPerPage-1) { info += 'style="display: none;"'; }
                        info += '><td>';
                        info += mapObj._llKeys[rowKey].title[i] || '';
                        info += '</td><td>';
                        info += mapObj._llKeys[rowKey].info[i] || '';
                        info += '</td></tr>';
                    }
                    info += '</table>';
                    if (totalRows > rowsPerPage)
                    {
                        info += '<div style="width: 100%;">';
                        info += '<a class="infoPaging" id="prev_';
                        info += mapObj._llKeys[rowKey].id;
                        info += '" href="#" style="display: none;">&lt; Prev</a> ';
                        info += '<a class="infoPaging" id="next_';
                        info += mapObj._llKeys[rowKey].id;
                        info += '" href="#" style="float: right;">Next &gt;</a>';
                        info += '</div>';
                    }
                }
                else
                {
                    info = _.compact(mapObj._llKeys[rowKey].info).join();
                }

                var details = {title: title, info: info};
                if (mapObj._iconCol && row[mapObj._iconCol.id])
                {
                    var icon;
                    if (mapObj._iconCol.dataTypeName == 'url')
                    {
                        icon = row[mapObj._iconCol.id].url;
                    }
                    else
                    {
                        icon = mapObj._iconCol.baseUrl() + row[mapObj._iconCol.id];
                    }
                    if (icon) { details.icon = icon; }
                }
                if (mapObj._sizeValueCol && mapObj._segments[mapObj._sizeValueCol.id])
                {
                    for (var i = 0; i < mapObj._numSegments; i++)
                    {
                        if (parseFloat(row[mapObj._sizeValueCol.id]) <=
                            mapObj._segments[mapObj._sizeValueCol.id][i])
                        { details.size  = 10+(6*i); break; }
                    }
                }
                if (mapObj.settings.view.displayFormat.color)
                {
                    var rgb = $.hexToRgb(mapObj.settings.view.displayFormat.color);
                    details.color = [ rgb.r, rgb.g, rgb.b ];
                }
                if (mapObj._colorValueCol && mapObj._segments[mapObj._colorValueCol.id])
                {
                    for (var i = 0; i < mapObj._numSegments; i++)
                    {
                        if (parseFloat(row[mapObj._colorValueCol.id]) <=
                            mapObj._segments[mapObj._colorValueCol.id][i])
                        {
                            var rgb = mapObj._gradient[i];
                            details.color = [ rgb.r, rgb.g, rgb.b ];
                            break;
                        }
                    }
                }

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
                        geometry = { latitude: lat, longitude: longVal,
                                     id: mapObj._llKeys[rowKey].id };
                        break;
                    case 'polygon':
                        geometry = { rings: row[locCol.id].geometry.rings };
                        break;
                    case 'polyline':
                        geometry = { paths: row[locCol.id].geometry.paths };
                        break;
                }

                return mapObj.renderGeometry(geoType, geometry,
                    mapObj._llKeys[rowKey].id, details);
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

                var filterColumn = mapObj._geoCol || mapObj._locCol;

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
                                        value: (axis == 'x') ? 'LONGITUDE' : 'LATITUDE',
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

                var query = $.extend(true, {}, mapObj.settings.view.query);
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
                mapObj.settings.view.update({ query: query}, false, true);
            },

            resizeHandle: function(event)
            {
                // Implement if you need to do anything on resize
            },

            getColumns: function()
            {
                var mapObj = this;
                var view = mapObj.settings.view;
                mapObj._infoIsHtml = false;

                // Preferred location column
                if (!$.isBlank(view.displayFormat.plot.locationId))
                { mapObj._locCol =
                    view.columnForTCID(view.displayFormat.plot.locationId); }

                // For updateColumnsByViewport to filter on geometries.
                mapObj._geoCol = _.detect(view.realColumns, function(col)
                    { return _.include(['geospatial', 'location'], col.renderTypeName); });

                // Older separate lat/long
                if (!$.isBlank(view.displayFormat.plot.latitudeId))
                { mapObj._latCol =
                    view.columnForTCID(view.displayFormat.plot.latitudeId); }
                if (!$.isBlank(view.displayFormat.plot.longitudeId))
                { mapObj._longCol =
                    view.columnForTCID(view.displayFormat.plot.longitudeId); }

                mapObj._titleCol =
                    view.columnForTCID(view.displayFormat.plot.titleId);

                mapObj._infoCol =
                    view.columnForTCID(view.displayFormat.plot.descriptionId);
                mapObj._infoIsHtml =
                    (mapObj._infoCol || {}).renderTypeName == 'html';

                mapObj._redirectCol =
                    view.columnForTCID(view.displayFormat.plot.redirectId);

                mapObj._iconCol = view.columnForTCID(view.displayFormat.plot.iconId);

                mapObj._objectIdCol = _.detect(view.realColumns, function(col)
                    { return col.name.toUpperCase() == 'OBJECTID'; });
                mapObj._objectIdKey = (mapObj._objectIdCol || {}).name;

                var aggs = {};
                _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
                {
                    var c = view.columnForTCID(
                        view.displayFormat.plot[colName + 'Id']);
                    if (!$.isBlank(c))
                    {
                        mapObj['_' + colName + 'Col'] = c;
                        aggs[c.id] = ['maximum', 'minimum'];
                    }
                });

                if (!_.isEmpty(aggs))
                {
                    if (!mapObj._delayRenderData) { mapObj._delayRenderData = 0; }
                    mapObj._delayRenderData++;

                    view.getAggregates(function()
                    { calculateSegmentSizes(mapObj, aggs) }, aggs);
                }

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
            },

            getText: function(row, col, plain)
            {
                var t = !_.isUndefined(col) ? row[col.id] : null;

                if (_.isNull(t)) { return t; }
                if (col.renderTypeName == 'location')
                {
                    var a = t.human_address;
                    if (_.isNull(a) || _.isUndefined(a)) { t = null; }
                    else
                    {
                        t = blist.data.types.location
                            .renderAddress({human_address: a}, plain);
                    }
                }
                else if (_.include(['number', 'money', 'percent'], col.renderTypeName))
                {
                    t = blist.data.types[col.renderTypeName].filterRender(t, col, plain);
                }
                return t;
            }
        }
    }));

    var calculateSegmentSizes = function(mapObj, aggs)
    {
        mapObj._segments = {};
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
