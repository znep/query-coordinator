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
            var mapType = options.view.displayFormat.type || 'google';

            var mapClass = $.socrataMap[mapType];
            if (!$.isBlank(mapClass))
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

                mapObj._origData = {valid: mapObj.settings.view.valid,
                    mapType: mapObj.settings.view.displayFormat.type,
                    layers: mapObj.settings.view.displayFormat.layers};

                mapObj.ready();
            },

            columnsLoaded: function()
            {
                var mapObj = this;
                if (mapObj.buildLegend && mapObj._colorValueCol)
                {
                    if (!mapObj._gradient)
                    {
                        mapObj._gradient = $.gradient(mapObj._numSegments,
                                mapObj.settings.view.displayFormat.color ||
                                "#0000ff");
                    }

                    mapObj.buildLegend(mapObj._colorValueCol.name,
                        _.map(mapObj._gradient,
                              function(c) { return "#"+$.rgbToHex(c); }
                    ));
                }
            },

            reset: function()
            {
                var mapObj = this;
                mapObj.$dom().removeData('socrataVisualization');
                mapObj.$dom().empty();
                // We need to change the ID so that maps (such as ESRI) recognize
                // something has changed, and reload properly
                mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
                mapObj.$dom().socrataMap(mapObj.settings);
            },

            needsFullReset: function()
            {
                var od = this._origData || {};
                var view = this.settings.view;
                return view.valid !== od.valid ||
                    view.displayFormat.type != od.mapType ||
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

            renderRow: function(row)
            {
                var mapObj = this;

                if (mapObj._displayConfig.noLocations)
                { return true; }

                if (_.isUndefined(mapObj._locCol) &&
                    (_.isUndefined(mapObj._latCol) ||
                     _.isUndefined(mapObj._longCol)))
                {
                    mapObj.errorMessage = 'No columns defined';
                    return false;
                }

                var lat;
                var longVal;
                if (!_.isUndefined(mapObj._locCol))
                {
                    var loc = row[mapObj._locCol.id];
                    if (_.isNull(loc)) { return true; }
                    lat = parseFloat(loc.latitude);
                    longVal = parseFloat(loc.longitude);
                }
                else
                {
                    lat = row[mapObj._latCol.id];
                    longVal = row[mapObj._longCol.id];
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

                if (!mapObj._llKeys) mapObj._llKeys = {};
                var rowKey = lat.toString();
                rowKey    += ',';
                rowKey    += longVal.toString();
                if (!mapObj._llKeys[rowKey])
                {
                    mapObj._llKeys[rowKey] = { title: [], info: [] };
                    mapObj._llKeys[rowKey].id = row.id;
                }
                mapObj._llKeys[rowKey].title.push(getText(row,
                    mapObj._titleCol, true));
                mapObj._llKeys[rowKey].info.push(getText(row,
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
                if (mapObj._sizeValueCol)
                {
                    for (var i = 0; i < mapObj._numSegments; i++)
                    {
                        if (parseFloat(row[mapObj._sizeValueCol.id]) <=
                            mapObj._segments[mapObj._sizeValueCol.id][i])
                        { details.size  = 10+(6*i); break; }
                    }
                }
                if (mapObj._colorValueCol)
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

                return mapObj.renderPoint(
                    lat, longVal, mapObj._llKeys[rowKey].id, details);
            },

            renderPoint: function(latVal, longVal, rowId, details)
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

            getColumns: function()
            {
                var mapObj = this;
                var view = mapObj.settings.view;
                mapObj._infoIsHtml = false;

                // Preferred location column
                if (!$.isBlank(view.displayFormat.plot.locationId))
                { mapObj._locCol =
                    view.columnForTCID(view.displayFormat.plot.locationId); }

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

                var aggs = {};
                _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
                {
                    var c = view.columnForTCID(
                        view.displayFormat.plot[colName + 'Id']);
                    if (!$.isBlank(c))
                    {
                        mapObj['_' + colName + 'Col'] = c;
                        aggs[c.id] = ['maximum', 'minimum'];
                        //calculateSegmentSizes(mapObj, c);
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
            }
        }
    }));

    var getText = function(row, col, plain)
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
    };


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

            if (mapObj._$legend.length > 0 && mapObj._colorValueCol == column)
            {
                mapObj._$legend.find('span:first').text(column.aggregates.minimum);
                mapObj._$legend.find('span:last').text(column.aggregates.maximum);
            }
        });

        mapObj._delayRenderData--;
        if (!mapObj._delayRenderData && mapObj._delayedRenderData)
        {
            _.each(mapObj._delayedRenderData, function(f) { f(); });
            mapObj._delayedRenderData = [];
        }
    };

})(jQuery);
