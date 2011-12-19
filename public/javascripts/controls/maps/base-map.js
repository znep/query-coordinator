(function($)
{
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    blist.namespace.fetch('blist.openLayers');

    blist.openLayers.ZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, {
        draw: function(px)
        {
            // derived from PanZoomBar source, because it's the only way to change
            // these sizes. because of course.

            OpenLayers.Control.prototype.draw.apply(this, arguments);
            px = this.position.clone();
            this.buttons = [];

            var padding = new OpenLayers.Size(-2, -2);

            // HACK HACK HACK HACK HCAK HCAK HCAKHCAKHC AKHACKHAC HKACK HACKH ACHKACHK
            var sz = new OpenLayers.Size(21, 21);
            this._addButton('zoomin', 'zoom-plus-mini.png', px.add(padding.w, padding.h), sz);
            var centered = this._addZoomBar(px.add(padding.w + 1, padding.h + 19));
            this._addButton('zoomout', 'zoom-minus-mini.png', centered.add(-1, 2), sz);

            return this.div;
        },

        CLASS_NAME: "blist.openLayers.ZoomBar"
    });

    var geographicProjection = new OpenLayers.Projection('EPSG:4326');

    // TODO: There is probably a better way to do this caching.
    Proj4js.defs["EPSG:2926"] = "+proj=lcc +lat_1=48.73333333333333 +lat_2=47.5 +lat_0=47 +lon_0=-120.8333333333333 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +to_meter=0.3048006096012192 +no_defs";
    Proj4js.defs["EPSG:102100"] = "+proj=merc +lon_0=0 +x_0=0 +y_0=0 +a=6378137 +b=6378137  +units=m +nadgrids=@null";

    $.Control.extend('socrataMap', {
        _getMixins: function(options)
        {
            var mixins = [];
            var df = options.displayFormat || options.view.displayFormat;
            var mapService = df.type || 'google';
            if (mapService == 'heatmap' || options.view.isArcGISDataset())
            {
                mapService = 'esri';
            }
            else if (options.view.isGeoDataset())
            {
                mapService = 'openlayers';
            }
            mixins.push(mapService);

            if (options.view.isArcGISDataset()) { mixins.push('arcGISmap'); }

            var plotStyle = df.plotStyle;
            if (df.type == 'heatmap')
            { plotStyle  = 'heatmap'; }
            mixins.push(plotStyle);

            return mixins;
        },

        isValid: function()
        {
            return Dataset.map.isValid(this._primaryView, this._displayFormat);
        },

        initializeVisualization: function ()
        {
            var mapObj = this;

            mapObj._segments = {};
            mapObj._numSegments = 6;

            if (mapObj._primaryView.isGeoDataset())
            {
                mapObj._geo = mapObj._primaryView.metadata.custom_fields.geo;
            }

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

            mapObj.initializeFlyouts((mapObj._displayFormat.plot || {}).descriptionColumns);


            mapObj._origData = {
                displayFormat: mapObj._displayFormat,
                mapType: mapObj._displayFormat.type,
                plotStyle: mapObj._displayFormat.plotStyle,
                layers: mapObj._displayFormat.layers};

            mapObj._highlightColor = $.rgbToHex($.colorToObj(
                blist.styles.getReferenceProperty('itemHighlight', 'background-color')));

            mapObj.ready();

            mapObj.initializeMap();
        },

        initializeMap: function()
        {
            var mapObj = this;

            var mapOptions =
            {
                theme: '/stylesheets/openlayers/style.css',
                projection: 'EPSG:900913',
                displayProjection: geographicProjection,
                units: 'm',
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                  20037508.34,  20037508.34),
                maxResolution: 156543.0339,
                numZoomLevels: 21
            }

            OpenLayers.ImgPath = '/images/openlayers/';
            OpenLayers.ProxyHost = '/api/proxy?proxyUrl=';

            mapObj.map = new OpenLayers.Map(mapObj.$dom()[0], mapOptions);

            mapObj.map.removeControl(mapObj.map.getControlsByClass('OpenLayers.Control.PanZoom')[0]);
            mapObj.map.addControl(new blist.openLayers.ZoomBar());
            mapObj.map.addControl(new OpenLayers.Control.MousePosition()); // FIXME: Remove.

            mapObj.initializeBaseLayers();
            mapObj.populateLayers();

            if (!mapObj._markers)
            { mapObj._markers = {}; }

            if (!mapObj._displayLayers)
            { mapObj._displayLayers = []; }

            mapObj.initializeEvents();

            mapObj.mapLoaded();
        },

        initializeEvents: function()
        {
            var mapObj = this;

            mapObj.map.events.register('moveend', mapObj.map, function()
            {
                if (mapObj._initialLoad) { return; }
                if (mapObj._boundsChanging)
                { delete mapObj._boundsChanging; delete mapObj._isResize; return; }

                mapObj.updateDatasetViewport(mapObj._isResize);
                mapObj.updateRowsByViewport();
                delete mapObj._isResize;
            });

            mapObj._hoverTimers = {};
            if ($.subKeyDefined(mapObj, '_displayFormat.identifyTask') &&
                    $.subKeyDefined(mapObj._displayFormat.identifyTask, 'url') &&
                    $.subKeyDefined(mapObj._displayFormat.identifyTask, 'layerId') &&
                    $.subKeyDefined(mapObj._displayFormat.identifyTask, 'attributes') &&
                    mapObj._displayFormat.identifyTask.attributes.length > 0)
            {
                mapObj._identifyParameters = new esri.tasks.IdentifyParameters();
                mapObj._identifyParameters.tolerance = 3;
                mapObj._identifyParameters.returnGeometry = false;
                mapObj._identifyParameters.layerIds =
                    [mapObj._displayFormat.identifyTask.layerId];
                mapObj._identifyParameters.layerOption =
                    esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
                mapObj._identifyParameters.width  = mapObj.map.getSize().w;
                mapObj._identifyParameters.height = mapObj.map.getSize().h;

                mapObj.map.events.register('click', mapObj.map, function(evt)
                {
                    var offsetTop = $(mapObj.map.div).offset().top;
                    var lonlat = layer.getLonLatFromViewPortPx(
                        new OpenLayers.Pixel(evt.clientX, evt.clientY + offsetTop));
                    var geometry = new esri.geometry.Point(lonlat.lon, lonlat.lat, sr);
                    var extent = mapObj.map.getExtent();
                    extent = new esri.geometry.Extent(extent.left, extent.bottom,
                                                      extent.right, extent.top);

                    mapObj._identifyParameters.geometry = geometry;
                    mapObj._identifyParameters.mapExtent = extent;

                    new esri.tasks.IdentifyTask(mapObj._displayFormat.identifyTask.url)
                        .execute(mapObj._identifyParameters,
                        function(idResults)
                        {
                            var closeBox = function()
                            { if (viewConfig._popup)
                                {
                                    mapObj.map.removePopup(viewConfig._popup);
                                    viewConfig._popup.destroy();
                                    viewConfig._popup = null;
                                }
                            };
                            closeBox();
                            if (idResults.length < 1) { return; }

                            var feature = idResults[0].feature;
                            var info = _.map(mapObj._displayFormat.identifyTask.attributes,
                                function(attribute)
                                { return attribute.text + ': ' +
                                    feature.attributes[attribute.key]; }).join('<br />');

                            // FIXME: There is some randomly occuring bug where this.size is not set.
                            // See external-esri-map for details.
                            var popup = new OpenLayers.Popup.FramedCloud(null,
                                lonlat, null, info, null, true, closeBox);
                            viewConfig._popup = popup;
                            mapObj.map.addPopup(popup);
                        });
                });
            }
            else
            {
                $.live("circle, image, path, text, oval, rect", 'click', function(evt)
                {
                    var features = findFeatureFromEvent(mapObj, evt);
                    if (_.isEmpty(features)) { return null; }
                    _.each(features, function(datum)
                    {
                        var feature = datum.feature;
                        var layer = datum.layer;
                        if (layer.dataViewConfig._renderType == 'clusters')
                        {
                            mapObj.map.setCenter(feature.geometry.getBounds().getCenterLonLat());
                            if (mapObj.currentZoom()
                                < mapObj.map.getZoomForExtent(feature.attributes.bbox))
                            { mapObj.map.zoomToExtent(feature.attributes.bbox); }
                            else
                            { mapObj.map.zoomIn(); }
                        }
                        else
                        {
                            layer.dataViewConfig._selectControl.select(feature);
                            var dupKey = feature.attributes.dupKey;
                            if (!$.isBlank(mapObj._hoverTimers[dupKey]))
                            {
                                clearTimeout(mapObj._hoverTimers[dupKey]);
                                delete mapObj._hoverTimers[dupKey];
                            }
                            mapObj._primaryView.highlightRows(feature.attributes.rows, 'select');
                        }
                    });
                });
            }
            $.live("circle, image, path, text, oval, rect", 'mouseover', function(evt)
            {
                var features = findFeatureFromEvent(mapObj, evt);
                if (_.isEmpty(features)) { return null; }
                _.each(features, function(datum)
                {
                    var feature = datum.feature;
                    var layer = datum.layer;
                    if (layer.dataViewConfig._renderType == 'clusters')
                    { layer.dataViewConfig._clusterBoundaries
                        .addFeatures(feature.attributes.boundary()); }
                    else
                    {
                        var dupKey = feature.attributes.dupKey;
                        if (!$.isBlank(mapObj._hoverTimers[dupKey]))
                        {
                            clearTimeout(mapObj._hoverTimers[dupKey]);
                            delete mapObj._hoverTimers[dupKey];
                        }
                        mapObj._primaryView.highlightRows(feature.attributes.rows);
                    }
                });
            });
            $.live("circle, image, path, text, oval, rect", 'mouseout', function(evt)
            {
                var features = findFeatureFromEvent(mapObj, evt);
                if (_.isEmpty(features)) { return null; }
                _.each(features, function(datum)
                {
                    var feature = datum.feature;
                    var layer = datum.layer;
                    if (layer.dataViewConfig._renderType == 'clusters')
                    { layer.dataViewConfig._clusterBoundaries.removeAllFeatures(); }
                    else
                    {
                        var dupKey = feature.attributes.dupKey;
                        mapObj._hoverTimers[dupKey] = setTimeout(function()
                            {
                                delete mapObj._hoverTimers[dupKey];
                                mapObj._primaryView.unhighlightRows(feature.attributes.rows);
                            }, 100);
                    }
                });
            });
        },

        currentZoom: function()
        {
            if (this.map)
            { return this.map.getZoom(); }
        },

        columnsLoaded: function()
        {
            var mapObj = this;
            if (mapObj._byView[mapObj._primaryView.id]._colorValueCol)
            {
                if (!mapObj._gradient)
                {
                    mapObj._gradient = $.gradient(mapObj._numSegments,
                            mapObj._displayFormat.color || "#0000ff");
                }

                mapObj.$legend({
                    name: mapObj._byView[mapObj._primaryView.id]
                        ._colorValueCol.name,
                    gradient: _.map(mapObj._gradient,
                          function(c) { return "#"+$.rgbToHex(c); }
                )});
            }
        },

        mapLoaded: function()
        {
            // This is called once a map has been loaded, as type-appropriate
            if (this._primaryView.snapshotting)
            { setTimeout(this._primaryView.takeSnapshot, 2000); }
        },

        noReload: function()
        {
            var mapObj = this;
            var oldDF = $.extend({}, mapObj._origData.displayFormat);
            var newDF = $.extend({}, mapObj._displayFormat);
            _.each(['viewport'], function(property)
            { delete oldDF[property]; delete newDF[property]; });

            return _.isEqual(oldDF, newDF);
        },

        reloadSpecialCases: function()
        {
            var mapObj = this;
            if (!_.isEqual(mapObj._origData.displayFormat.viewport, mapObj._displayFormat.viewport))
            { mapObj.setViewport(mapObj._displayFormat.viewport); }
        },

        reset: function()
        {
            var mapObj = this;
            mapObj.clearGeometries();
            mapObj._markers = {};
            $(mapObj.currentDom).removeData('socrataMap');
            mapObj.$dom().empty();
            mapObj._obsolete = true;
            if (mapObj._legend) { mapObj._legend.$dom.hide(); }
            // We need to change the ID so that maps (such as ESRI) recognize
            // something has changed, and reload properly
            mapObj.$dom().attr('id', mapObj.$dom().attr('id') + 'n');
            $(mapObj.currentDom).socrataMap($.extend({}, mapObj.settings, {view: mapObj._primaryView,
                displayFormat: mapObj._displayFormat}));
        },

        // Read: Mixins changed. TODO: Rewrite how mixins work.
        needsFullReset: function()
        {
            var od = this._origData || {};
            return this._displayFormat.type != od.mapType ||
                this._displayFormat.plotStyle != od.plotStyle;
        },

        clearGeometries: function()
        {
            _.each(this._displayLayers, function(displayLayer)
            { displayLayer.removeAllFeatures(); });
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            if (mapObj._requireRowReload && !mapObj._byView[mapObj._primaryView.id]._viewportChanged)
            { delete mapObj._neverCluster; }

            mapObj._super();

            mapObj.$dom().siblings('#mapLayers').addClass('hide');

            _.each(mapObj._byView, function(viewConfig)
            {
                viewConfig._llKeys = {};
                _.each(['_locCol', '_latCol', '_longCol', '_iconCol', '_quantityCol',
                        '_sizeValueCol', '_colorValueCol', '_redirectCol'], function(prop)
                { delete viewConfig[prop]; });
            });

            if (mapObj._baseLayers)
            { _.each(mapObj._baseLayers, function(layer) { layer.destroy(false); }); }

            mapObj._markers = {};
            _.each(mapObj._byView, function(viewConfig)
            {
                if (viewConfig._renderType == 'points'
                    && !$.subKeyDefined(viewConfig, '_animation.finished')) // FIXME: Hack.
                { viewConfig._displayLayer.removeAllFeatures(); }
                if (viewConfig._clusterBoundaries)
                { viewConfig._clusterBoundaries.removeAllFeatures(); }
            });
            delete mapObj._gradient;
        },

        reloadVisualization: function()
        {
            var mapObj = this;

            mapObj.initializeBaseLayers();
            mapObj.populateLayers();
            mapObj.initializeFlyouts((mapObj._displayFormat
                .plot || {}).descriptionColumns);

            mapObj._origData = {
                displayFormat: mapObj._displayFormat,
                mapType: mapObj._displayFormat.type,
                plotStyle: mapObj._displayFormat.plotStyle,
                layers: mapObj._displayFormat.layers};

            mapObj._super();
        },

        populateLayers: function()
        {
            var mapObj = this;
            var layers = mapObj._baseLayers;
            if (layers.length < 2) { return; }

            var $layers = mapObj.$dom().siblings('#mapLayers');
            var $layersList = $layers.find('ul');
            $layersList.empty();
            _.each(layers, function(l)
            {
                var lId = 'mapLayer_' + l.name;
                $layersList.append('<li data-layerid="' + l.id + '"' +
                    '><input type="checkbox" id="' + lId +
                    '"' + (l.visibility ? ' checked="checked"' : '') +
                    ' /><label for="' + lId + '">' + l.name + '</label><br />' +
                    '<span class="sliderControl" data-min="0" data-max="100" ' +
                    'data-origvalue="' +
                    (l.opacity*100) + '" /></li>');
                $layersList.find('li:last').data('layer', l);
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
                    $_this.parent().data('layer').setOpacity(ui.value/100);
                    $_this.next(':input').val(ui.value);
                });
            });

            var reorderLayers = function(event, ui)
            {
                var layer = $(ui.item).data('layer');
                if (!layer) { return; }
                var index = $layersList.find('li').index(ui.item);

                var oldBaseLayer, newBaseLayer;
                if (index == 0)
                { oldBaseLayer = mapObj.map.baseLayer; newBaseLayer = layer; }
                else if (mapObj.map.getLayerIndex(layer) == 0)
                { oldBaseLayer = mapObj.map.layers[0]; newBaseLayer = mapObj.map.layers[1]; }

                if (oldBaseLayer && newBaseLayer)
                {
                    mapObj.map.setBaseLayer(newBaseLayer);
                    newBaseLayer.setIsBaseLayer(true);
                    oldBaseLayer.setIsBaseLayer(false);
                    oldBaseLayer.setVisibility(true);
                }
                mapObj.map.setLayerIndex(layer, index);
            };
            $layersList.sortable({containment: 'parent',
                placeholder: 'ui-state-highlight',
                forcePlaceholderSize: true, tolerance: 'pointer',
                update: reorderLayers, cancel: 'a.ui-slider-handle'
            });

            $layers.find(':checkbox').click(function(e)
            {
                var $check = $(e.currentTarget);
                $check.parent().data('layer').setVisibility($check.value());
            });

            $layers.removeClass('hide');
        },

        hideLayers: function()
        {
            _.each(this._baseLayers, function(layer)
            { layer.setVisibility(false); });
        },

        showLayers: function()
        {
            _.each(this._baseLayers, function(layer)
            { layer.setVisibility(true); });
        },

        handleClustersLoaded: function(clusters, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];
            if (!viewConfig._clusterBoundaries)
            {
                viewConfig._clusterBoundaries = new OpenLayers.Layer.Vector();
                mapObj.map.addLayer(viewConfig._clusterBoundaries);
                mapObj.map.setLayerIndex(viewConfig._clusterBoundaries,
                    mapObj.map.layers.indexOf(viewConfig._displayLayer));
            }
            mapObj.renderClusters(clusters, view);
        },

        renderClusters: function(clusters, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            _.each(clusters, function(cluster)
            { mapObj.renderCluster(cluster, { dataView: view }); });

            mapObj._renderedRows += _.reduce(clusters, function(memo, cluster)
            { return memo + cluster.size; }, 0);

            mapObj.rowsRendered();

            if (_.all(viewConfig._displayLayer.features, function(feature)
                { return !feature.onScreen(); }))
            {
                viewConfig._fetchPoints = true;
                mapObj.getDataForView(view);
                delete viewConfig._fetchPoints;
                return;
            }

            viewConfig._lastClusterSet = _.map(clusters, function(cluster) { return cluster.id; });

            // If no animations or it's a gather animation, clear it out.
            if (viewConfig._animation && viewConfig._animation.direction == 'none')
            { viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds); }
        },

        generateFlyoutLayout: function(columns, titleId)
        {
            var mapObj = this;
            var titleId = (mapObj._displayFormat.plot || {}).titleId;
            if (_.isEmpty(columns) && $.isBlank(titleId))
            { return null; }

            var layout = mapObj._super(columns);
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

        getFlyout: function(rows, details, dataView)
        {
            if (rows.length < 1) { return null; }

            var mapObj = this;
            var $info = $.tag({tagName: 'div', 'class': 'mapInfoContainer'});
            _.each(rows, function(r) { $info.append(mapObj.renderFlyout(r, dataView)); });

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

            if (!mapObj._byView[mapObj._primaryView.id]._locCol) { return $info; }
            var loc = rows[0][mapObj._byView[mapObj._primaryView.id]._locCol.lookup];
            if (loc.latitude && loc.longitude)
            {
                if (mapObj._displayFormat.type == 'bing')
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://www.bing.com/maps/?where1='+loc.latitude+','+loc.longitude,
                    target: '_blank', contents: 'View in Bing Maps'})); }
                else
                { $info.append($.tag({tagName: 'a', 'class': 'external_link',
                    href: 'http://maps.google.com/maps?q='+loc.latitude+','+loc.longitude,
                    target: '_blank', contents: 'View in Google Maps'})); }
            }

            return $info;
        },

        rowToPoint: function(row, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (mapObj._displayFormat.noLocations && _.isUndefined(row.feature))
            { return true; }

            // A configured Location column always takes precedence.
            // _geoCol is and always will be a fallback.
            var locCol = viewConfig._locCol || viewConfig._geoCol;

            if (_.isUndefined(row.feature) && _.isUndefined(locCol) &&
                (_.isUndefined(viewConfig._latCol) || _.isUndefined(viewConfig._longCol)))
            {
                mapObj.errorMessage = 'No columns defined';
                return false;
            }

            var point = {isPoint: true};

            if (!_.isUndefined(row.feature))
            {
                var loc = row.feature.geometry;
                if (_.include([102100,102113,3857], loc.spatialReference.wkid))
                { loc = esri.geometry.webMercatorToGeographic(loc); }

                if (loc.type != 'point')
                { point.isPoint = false; }
                else
                {
                    point.latitude = loc.y;
                    point.longitude = loc.x;
                }
            }
            else if (!$.isBlank(locCol))
            {
                var loc = row[locCol.id];
                if ($.isBlank(loc)) { return true; }

                if (loc.geometry && (loc.geometry.rings || loc.geometry.paths))
                { point.isPoint = false; }
                else
                {
                    point.latitude = parseFloat(loc.latitude);
                    point.longitude = parseFloat(loc.longitude);
                }
            }
            else
            {
                point.latitude = parseFloat(row[viewConfig._latCol.id]);
                point.longitude = parseFloat(row[viewConfig._longCol.id]);
            }

            // Incomplete points will be safely ignored
            if (point.isPoint &&
                _.isNull(point.latitude) || _.isNaN(point.latitude) ||
                _.isNull(point.longitude) || _.isNaN(point.longitude)) { return true; }
            if (point.latitude <= -90 || point.latitude >= 90 ||
                    point.longitude <= -180 || point.longitude >= 180)
            {
                mapObj.errorMessage = 'Latitude must be between -90 and 90, ' +
                    'and longitude must be between -180 and 180';
                return false;
            }

            return point;
        },

        renderRow: function(row, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (mapObj._renderType == 'clusters') { return true; }

            var point = mapObj.rowToPoint(row, view);
            if (_.isBoolean(point)) { return point; }

            if (!viewConfig._llKeys) viewConfig._llKeys = {};
            var rowKey;
            if (point.isPoint)
            {
                rowKey = point.latitude.toString();
                rowKey += ',';
                rowKey += point.longitude.toString();
            }
            else if (row.feature)
            { rowKey = row.feature.attributes[viewConfig._objectIdKey]; }
            else
            { rowKey = view.id + row.id; } // too difficult to identify duplicates

            if (!viewConfig._llKeys[rowKey])
            { viewConfig._llKeys[rowKey] = { rows: [] }; }

            var ri = viewConfig._llKeys[rowKey].rows.length;
            _.each(viewConfig._llKeys[rowKey].rows, function(cachedRow, i)
                { if (row.id == cachedRow.id) { ri = i; } });
            viewConfig._llKeys[rowKey].rows[ri] = row;

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
                    { details.size = i + 1; break; }
                }
            }
            if (mapObj._displayFormat.color)
            { details.color = mapObj._displayFormat.color; }
            if (viewConfig._colorValueCol
                && mapObj._segments[viewConfig._colorValueCol.id])
            {
                for (var i = 0; i < mapObj._numSegments; i++)
                {
                    if (parseFloat(row[viewConfig._colorValueCol.id]) <=
                        mapObj._segments[viewConfig._colorValueCol.id][i])
                    {
                        var rgb = mapObj._gradient[i];
                        details.color = $.rgbToHex(rgb);
                        break;
                    }
                }
            }

            if (row.color)
            { details.color = row.color; }

            if (row.icon)
            { details.icon = row.icon; }

            if (viewConfig._quantityCol)
            { details.heatStrength = parseFloat(row[viewConfig._quantityCol.id]); }

            if (row.meta)
            {
                var mapping = { 'mapIcon': 'icon', 'heat': 'heatStrength',
                    'pinSize': 'size', 'pinColor': 'color' };
                _.each(_.keys(mapping), function(key)
                {
                    if (row.meta[key])
                    { details[mapping[key]] = row.meta[key]; }
                });
            }

            var locCol = viewConfig._locCol || viewConfig._geoCol;
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

            if (geoType == 'point' && mapObj._primaryView._rowClusterParents)
            { details.clusterParent = mapObj._primaryView._rowClusterParents[row.sid]; }

            var geometry;
            switch (geoType)
            {
                case 'point':
                    geometry = { latitude: point.latitude, longitude: point.longitude };
                    break;
                case 'polygon':
                    geometry = { rings: row[locCol.id].geometry.rings };
                    break;
                case 'polyline':
                    geometry = { paths: row[locCol.id].geometry.paths };
                    break;
            }

            details.dataView = view;

            var graphic = mapObj.renderGeometry(geoType, geometry, rowKey, details);
            if (viewConfig._animation)
            { viewConfig._animation.news.push(graphic); }

            return graphic;
        },

        enqueueGeometry: function()
        {
            if (!this._geometryQueue)
            { this._geometryQueue = []; }
            this._geometryQueue.push(arguments);
        },

        renderGeometry: function(geoType, geometry, dupKey, details)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[(details.dataView || mapObj._primaryView).id];

            var marker, newMarker;
            if (mapObj._markers[dupKey])
            {
                marker = mapObj._markers[dupKey];
                if (marker.style.externalGraphic != details.icon)
                {
                    marker = null;
                    newMarker = true;
                    viewConfig._displayLayer.removeFeatures([mapObj._markers[dupKey]]);
                    delete mapObj._markers[dupKey];
                }
            }
            else
            { newMarker = true; }

            var hasHighlight = _.any(details.rows, function(r)
                { return r.sessionMeta && r.sessionMeta.highlight; });
            if (geoType == 'point')
            {
                var lonlat;
                if (geometry instanceof OpenLayers.LonLat)
                { lonlat = geometry; }
                else
                { lonlat = new OpenLayers.LonLat(geometry.longitude, geometry.latitude); }
                lonlat.transform(geographicProjection, mapObj.map.getProjectionObject());

                if (!marker)
                { marker = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)); }
                else
                { marker.geometry = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat); }

                marker.attributes.clusterParent = details.clusterParent;
                if (details.dataView)
                { marker.attributes.flyout = mapObj.getFlyout(details.rows,
                    details.flyoutDetails, details.dataView); }

                if (details.icon)
                { marker.style = iconCache(mapObj, details.icon, marker, hasHighlight); }
                else
                {
                    marker.style = marker.style || {};
                    marker.style.fillColor = hasHighlight ? '#' + mapObj._highlightColor
                                                          : details.color || '#0000ff';
                    marker.style.strokeColor = '#ffffff';
                    marker.style.strokeWidth = 1;
                    marker.style.pointRadius = marker.style.pointRadius || 6;

                    if (details.size)
                    { marker.style.pointRadius = 6 + (2 * details.size); }
                }
            }
            else if (geoType == 'polyline')
            {
                // TODO: When we actually use this code, throw this all out.
                var geo = new OpenLayers.Geometry.LineString(
                    _.map(geometry.paths, function(point, p)
                    { return new OpenLayers.Geometry.Point(point.x, point.y); }));
                marker = new OpenLayers.Feature.Vector(geo.transform(
                    new OpenLayers.Projection('EPSG:900913'), mapObj.map.getProjectionObject()), {},
                    { stroke: true, strokeColor: '#000000' }
                );
            }
            else if (geoType == 'polygon')
            {
                if (newMarker)
                {
                    var geo = new OpenLayers.Geometry.Polygon(_.map(geometry.rings, function(ring, r)
                        { return new OpenLayers.Geometry.LinearRing( _.map(ring, function(point, p)
                            {
                                var point = geometry.getPoint(r, p);
                                return new OpenLayers.Geometry.Point(point.x || point[0],
                                                                     point.y || point[1]);
                            }));
                        }));
                    marker = new OpenLayers.Feature.Vector(geo.transform(
                        new OpenLayers.Projection('EPSG:900913'), mapObj.map.getProjectionObject()));
                }
                marker.style = {
                    fillColor: hasHighlight ? '#' + mapObj._highlightColor
                                            : (details.color || "#FF00FF"),
                    fillOpacity: _.isUndefined(details.opacity) ? 0.8 : details.opacity,
                    strokeColor: '#000000', strokeOpacity: 0.5
                };

                marker.attributes.flyout = mapObj.getFlyout(details.rows,
                    details.flyoutDetails, details.dataView);
                marker.attributes.redirects_to = details.redirect_to;
            }

            marker.attributes.heatStrength = 1;
            marker.attributes.rows = details.rows;
            marker.attributes.dupKey = dupKey;
            marker.attributes.boundary = function() { return []; };

            if (newMarker)
            {
                mapObj._markers[dupKey] = marker;
                viewConfig._displayLayer.addFeatures([marker]);
            }
            else
            { viewConfig._displayLayer.drawFeature(marker); }

            return marker;
        },

        renderCluster: function(cluster, details)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[details.dataView.id];

            if (cluster.size <= 0) { return; }

            var cluster_icon = '/images/map_cluster_';
            var size;
            if (cluster.size < 100)
            { cluster_icon += 'small.png'; size = 37; }
            else if (cluster.size < 1000)
            { cluster_icon += 'med.png';   size = 45; }
            else
            { cluster_icon += 'large.png'; size = 65; }

            var lonlat = new OpenLayers.LonLat(cluster.centroid.lon, cluster.centroid.lat)
                .transform(geographicProjection, mapObj.map.getProjectionObject());

            var boundary = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(
                    _.map(cluster.polygon, function(vertex)
                    { return new OpenLayers.Geometry.Point(vertex.lon, vertex.lat); }))]).transform(
                geographicProjection, mapObj.map.getProjectionObject()), {},
                { fillColor: '#0000dd', fillOpacity: 0.2, strokeWidth: 3, strokeColor: '#000088' });

            var bbox = new OpenLayers.Bounds(cluster.box.lon1, cluster.box.lat1,
                                             cluster.box.lon2, cluster.box.lat2)
                        .transform(geographicProjection, mapObj.map.getProjectionObject());

            var marker = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
                { bbox: bbox, isCluster: true },
                { externalGraphic: cluster_icon,
                  graphicWidth: size, graphicHeight: size,
                  graphicXOffset: -(size/2), graphicYOffset: -(size/2),
                  label: ''+cluster.size, cursor: 'pointer'
                } );

            marker.attributes.heatStrength = cluster.size;
            marker.attributes.clusterParent = cluster.parent;
            marker.attributes.clusterId = cluster.id;

            marker.attributes.boundary = function()
            {
                if (this.boundaries) { return this.boundaries; }

                // If there are no children, just use the provided polygon.
                if (_.isEmpty(cluster.childBoxes))
                { this.boundaries = [boundary]; return this.boundaries; }

                // If the size of the bbox is small or thin, don't bother.
                var nwPixel = viewConfig._displayLayer.getViewPortPxFromLonLat(
                    new OpenLayers.LonLat(cluster.box.lon1, cluster.box.lat1).transform(
                        geographicProjection, mapObj.map.getProjectionObject()));
                var sePixel = viewConfig._displayLayer.getViewPortPxFromLonLat(
                    new OpenLayers.LonLat(cluster.box.lon2, cluster.box.lat2).transform(
                        geographicProjection, mapObj.map.getProjectionObject()));
                var bboxWidth  = Math.abs(sePixel.x - nwPixel.x);
                var bboxHeight = Math.abs(sePixel.y - nwPixel.y);
                marker.attributes.bboxArea = bboxWidth * bboxHeight;
                marker.attributes.bboxRatio = bboxWidth / bboxHeight;

                // This catches 1-point clusters, too, which are of area 0 and ratio NaN.
                // Current role model for "too big" is USGS Earthquakes, Carribean 55-point cluster.
                if (marker.attributes.bboxArea < 100000)
                { this.boundaries = [boundary]; return this.boundaries; }
                if (marker.attributes.bboxRatio < 0.01)
                { this.boundaries = [boundary]; return this.boundaries; }

                // Alright, build from child boxes.
                this.boundaries = _.map(cluster.childBoxes, function(box)
                {
                    var bbox = new OpenLayers.Bounds(box.lon1, box.lat1,
                                                     box.lon2, box.lat2)
                        .transform(geographicProjection, mapObj.map.getProjectionObject());
                    return new OpenLayers.Feature.Vector(bbox.toGeometry(), {},
                        { fillColor: '#00dd00', fillOpacity: 0.2,
                          strokeWidth: 2, strokeColor: '#008800'  });
                });

                // And add some lines.
                var lines = new OpenLayers.Geometry.MultiLineString(_.map(this.boundaries,
                    function(child)
                    {
                        var childCenter = child.geometry.getBounds().getCenterLonLat();
                        return new OpenLayers.Geometry.LineString([
                            new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
                            new OpenLayers.Geometry.Point(childCenter.lon, childCenter.lat)
                        ]);
                    }));
                var lineBkgs = lines.clone();
                this.boundaries.push(new OpenLayers.Feature.Vector(lineBkgs, {},
                    { strokeWidth: 3, strokeColor: '#ffffff' }));
                this.boundaries.push(new OpenLayers.Feature.Vector(lines));

                return this.boundaries;
            };

            if (viewConfig._animation && viewConfig._animation.direction == 'spread')
            { marker.style.display = 'none'; }

            viewConfig._displayLayer.addFeatures([marker]);
            if (viewConfig._animation)
            { viewConfig._animation.news.push(marker); }

            return marker;
        },

        rowsRendered: function()
        {
            var mapObj = this;
            mapObj._super();

            if (mapObj._geometryQueue)
            { _.each(mapObj._geometryQueue,
                function(item) { mapObj.renderGeometry.apply(mapObj, item); }); }

            mapObj.adjustBounds();
            mapObj.runAnimation();

            // Create a copy of features on the wrong side of the dateline
            // and wrap around their X coordinate.
            // TODO: Wishing OpenLayers would do this automatically.
            if (mapObj._datelineHack)
            {
                _.each(mapObj._byView, function(viewConfig)
                {
                    var left = viewConfig._displayLayer.getExtent().left;
                    var difference
                        = (Math.abs(left)/left) * viewConfig._displayLayer.maxExtent.getWidth();
                    var features = _(viewConfig._displayLayer.features).chain()
                        .select(function(f) { return !f.onScreen(); })
                        .map(function(f) {
                            return new OpenLayers.Feature.Vector(
                                new OpenLayers.Geometry.Point(f.geometry.x + difference,
                                                              f.geometry.y),
                                $.extend({}, f.attributes, { datelineHack: true }),
                                f.style);
                        }).value();
                    viewConfig._displayLayer.addFeatures(features);
                });
            }

            _.each(mapObj._byView, function(viewConfig)
            { viewConfig._lastRenderType = viewConfig._renderType; });
            mapObj._lastZoomLevel = mapObj.currentZoom();
        },

        adjustBounds: function()
        {
            var mapObj = this;
            if ($.subKeyDefined(mapObj, '_primaryView.query.namedFilters.viewport'))
            { return; }

            mapObj._boundsChanging = true;
            if (mapObj._displayFormat.viewport)
            { mapObj.setViewport(mapObj._displayFormat.viewport); }
            else
            {
                var bounds = _.reduce(mapObj._displayLayers,
                    function(memo, layer) { memo.extend(layer.getDataExtent()); return memo; },
                    new OpenLayers.Bounds());
                mapObj.map.zoomToExtent(bounds);
            }
        },

        getViewport: function()
        {
            var mapObj = this;
            var extent = mapObj.map.getExtent();
            if (!extent) { return null; }
            extent = extent.transform(mapObj.map.getProjectionObject(), geographicProjection)
                           .toArray();
            var vp = { xmin: extent[0], ymin: extent[1], xmax: extent[2], ymax: extent[3] };

            // Test for wraparound.
            // Weird fact: cloning the extent above to minimize calcs didn't work.
            // Could be a mistake on my part. Doesn't make sense.
            var xmin =
                mapObj.map.baseLayer.getViewPortPxFromLonLat(new OpenLayers.LonLat(vp.xmin, vp.ymin)
                    .transform(geographicProjection, mapObj.map.getProjectionObject()));
            var xmax =
                mapObj.map.baseLayer.getViewPortPxFromLonLat(new OpenLayers.LonLat(vp.xmax, vp.ymin)
                    .transform(geographicProjection, mapObj.map.getProjectionObject()));
            var size = mapObj.map.getSize();

            // If each boundary is onscreen and within 10 pixels of the edge, yay.
            if (xmin.x > 10 && xmin.x < size.w)
            { vp.xmin = -180; }
            if (xmax.x > 0 && Math.abs(xmax.x - size.w) > 10)
            { vp.xmax = 180; }

            // OpenLayers can't display both sides of the dateline at once normally.
            mapObj._datelineHack = vp.xmin > vp.xmax;

            if (!$.isBlank(vp))
            {
                _.each(['xmin', 'ymin', 'xmax', 'ymax'], function(key)
                {
                    vp[key] = parseFloat(($.jsonIntToFloat(vp[key]) || 0).
                        toFixed(mapObj.settings.coordinatePrecision));
                });
            }
            return vp;
        },

        setViewport: function(viewport)
        {
            if (_.isEqual(viewport, this.getViewport() || {})) { return; }
            var bounds = new OpenLayers.Bounds(viewport.xmin, viewport.ymin,
                                               viewport.xmax, viewport.ymax);

            // Hack: zoomToExtent's getCenterLonLat goes nuts if it tries to capture an
            // extent that goes past the dateline. This triggers an if-statement inside.
            var tmp = this.map.baseLayer.wrapDateLine;
            this.map.baseLayer.wrapDateLine = true;
            this.map.zoomToExtent(bounds.transform(geographicProjection,
                                                   this.map.getProjectionObject()));
            this.map.baseLayer.wrapDateLine = tmp;
        },

        fitPoint: function(point)
        {
            var p = new OpenLayers.LonLat(point.longitude, point.latitude);
            if (!this.map.getExtent().containsLonLat(p))
            { this.map.setCenter(p); }
        },

        updateRowsByViewport: function(viewport, wrapIDL)
        {
            var mapObj = this;
            if (mapObj._displayFormat.plotStyle == 'heatmap') { return; }
            if (!viewport || !viewport.xmin) { viewport = mapObj.getViewport(); }
            if (!$.subKeyDefined(viewport, 'xmin'))
            {
                mapObj._needsViewportUpdate = true;
                return;
            }

            _.each(mapObj._dataViews, function(view)
            {
                var viewConfig = mapObj._byView[view.id];
                var filterColumn = viewConfig._locCol || viewConfig._geoCol;
                if ($.isBlank(filterColumn)
                    || !_.include(['location', 'geospatial'], filterColumn.renderTypeName))
                { return; }

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
                view.update({query: query}, false, true);
                viewConfig._viewportChanged = true;
            });
        },

        updateDatasetViewport: function(isAutomatic)
        {
            var mapObj = this;
            var vp = mapObj.getViewport();
            // Theory: All of these will be different if user-initiated
            // panning or zooming occurs. But one will hold constant if
            // it's just automatic.
            // Use the most recently set viewport
            var curVP = mapObj._currentViewport || {};
            if (isAutomatic || _.any(['xmin', 'ymin', 'ymax'], function(p)
                {
                    return vp[p].toFixed(mapObj.settings.coordinatePrecision) ==
                        (parseFloat(curVP[p]) || 0).toFixed(mapObj.settings.coordinatePrecision);
                }))
            {
                // If automatic and we have selected rows, make sure at least one is
                // in the viewport
                if (!_.isEmpty((mapObj._primaryView.highlightTypes || {}).select))
                {
                    var p = mapObj.rowToPoint(_.first(_.values(
                                    mapObj._primaryView.highlightTypes.select)), mapObj._primaryView);
                    if ((p || {}).isPoint)
                    { mapObj.fitPoint(p); }
                }
                return;
            }

            mapObj._currentViewport = vp;
            mapObj._primaryView.update({displayFormat: $.extend({},
                mapObj._displayFormat, { viewport: vp })}, false, true);
        },

        resizeHandle: function(event)
        {
            // Implement if you need to do anything on resize
            this._isResize = true;
        },

        getColumns: function()
        {
            var mapObj = this;
            var view = mapObj._primaryView;

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

                if (!$.subKeyDefined(mapObj._displayFormat, 'plot'))
                { return; }

                // Preferred location column
                if (!$.isBlank(mapObj._displayFormat.plot.locationId))
                { viewConfig._locCol =
                    view.columnForTCID(mapObj._displayFormat.plot.locationId); }

                viewConfig._redirectCol =
                    view.columnForTCID(mapObj._displayFormat.plot.redirectId);

                viewConfig._iconCol =
                    view.columnForTCID(mapObj._displayFormat.plot.iconId);

                var aggs = {};
                _.each(['colorValue', 'sizeValue', 'quantity'], function(colName)
                {
                    var c = view.columnForTCID(
                        mapObj._displayFormat.plot[colName + 'Id']);
                    if (!$.isBlank(c))
                    {
                        viewConfig['_' + colName + 'Col'] = c;
                        aggs[c.id] = ['maximum', 'minimum'];
                        if (colName == 'quantity')
                        { aggs[c.id].push('sum'); }
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

        getDataForAllViews: function()
        {
            var mapObj = this;

            if (!mapObj.isValid()) { return; }

            if (mapObj._displayFormat.plotStyle == 'heatmap')
            {
                mapObj._byView[mapObj._primaryView.id]._renderType = 'points';
                mapObj._byView[mapObj._primaryView.id]._neverCluster = true;
            }

            mapObj._super();
        },

        getDataForView: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (!viewConfig._displayLayer)
            {
                viewConfig._displayLayer = mapObj.buildViewLayer(view);
                mapObj.map.addLayer(viewConfig._displayLayer);
            }
            if (viewConfig._neverCluster || viewConfig._fetchPoints)
            {
                mapObj.initializeAnimation(null, view);
                mapObj._super(view);
                if (viewConfig._fetchPoints)
                { delete viewConfig._fetchPoints; }
                return;
            }

            viewConfig._renderType = 'clusters';
            view.getClusters(mapObj._displayFormat.viewport ||
                { 'xmin': -180, 'xmax': 180,
                  'ymin': -90,  'ymax': 90 }, mapObj._displayFormat, function(data)
            {
                if (_.isUndefined(viewConfig._neverCluster))
                { viewConfig._neverCluster = _.reduce(data, function(total, cluster)
                    { return total + cluster.size; }, 0) < mapObj._maxRows; }
                if (viewConfig._neverCluster)
                {
                    viewConfig._renderType = 'points';
                    mapObj.clearGeometries();
                    mapObj.getDataForView(view);
                    return;
                }

                if (!mapObj._displayFormat.viewport)
                {
                    var boundsObj = _.reduce(data, function(memo, cluster)
                        {
                            var bounds = new OpenLayers.Bounds(cluster.box.lon1, cluster.box.lat1,
                                                               cluster.box.lon2, cluster.box.lat2);
                            if (!memo) { return bounds; }
                            else { memo.extend(bounds); return memo; }
                        }, null).toArray();
                    var vp = { xmin: boundsObj[0], ymin: boundsObj[1],
                               xmax: boundsObj[2], ymax: boundsObj[3] };
                    mapObj._displayFormat.viewport = vp;
                    mapObj.getDataForView(view);
                    return;
                }

                if (_.all(data, function(cluster) { return (cluster.points || []).length > 0; }))
                {
                    if (_.isUndefined(viewConfig._unclusterLevel))
                    { viewConfig._unclusterLevel = mapObj.currentZoom(); }
                    else if (viewConfig._unclusterLevel < mapObj.currentZoom())
                    {
                        viewConfig._renderType = 'points';
                        var rowIds = _.flatten(_.pluck(data, 'points'));
                        var rowsToLoad = rowIds.length;
                        view.getRowsByIds(rowIds, function(data)
                        {
                            if (_.size(view._rowIDLookup) == rowsToLoad)
                            { mapObj.handleRowsLoaded(view._rowIDLookup, view); }
                        }, function()
                        {
                            // On error clear these variables so more requests will be triggered
                            delete mapObj._initialLoad;
                        });
                    }
                }
                else
                { delete viewConfig._unclusterLevel; }

                mapObj.initializeAnimation(data, view);

                if (viewConfig._renderType == 'clusters')
                { _.defer(function() { mapObj.handleClustersLoaded(data, view); }); }

                mapObj.totalRowsForAllViews();
                delete mapObj._initialLoad;
            },
            function()
            {
                // On error clear these variables so more requests will be triggered
                delete mapObj._initialLoad;
                viewConfig._fetchPoints = true;
                mapObj.getDataForView(view);
            });
        },

        buildViewLayer: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];
            var layer = viewConfig._displayLayer = new OpenLayers.Layer.Vector();
            viewConfig._displayLayer.dataView = view;
            viewConfig._displayLayer.dataViewConfig = viewConfig;

            mapObj._displayLayers.push(viewConfig._displayLayer);

            viewConfig._selectControl = new OpenLayers.Control.SelectFeature(layer,
                { onSelect: function(feature) { onFeatureSelect(mapObj, feature,
                    function(evt) { onFeatureUnselect(mapObj); }); },
                  onUnselect: function(feature) { onFeatureUnselect(mapObj, feature); } });
            mapObj.map.addControl(viewConfig._selectControl);

            return layer;
        },

        initializeAnimation: function(data, view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            viewConfig._animation = { news: [] };
            if (mapObj._displayFormat.plotStyle != 'point') { return; }
            if (_.isEmpty(data)) { return; }

            viewConfig._animation.olds = _.clone(viewConfig._displayLayer.features);

            if (
                // First load
                _.isUndefined(mapObj._lastZoomLevel)
                // Zoomed further than animations can handle TODO: Verify line unnecessary.
                //|| Math.abs(mapObj.currentZoom() - mapObj._lastZoomLevel) > 1
                // Panned
                || mapObj.currentZoom() == mapObj._lastZoomLevel
                // Same set of clusters as the last zoom level.
                || (_.all([viewConfig._renderType, viewConfig._lastRenderType],
                        function(type) { return type == 'clusters'; })
                    && _.all(data, function(cluster)
                    { return _.include(viewConfig._lastClusterSet || [], cluster.id); }))
                // Points do not animate into other points.
                || _.all([viewConfig._renderType, viewConfig._lastRenderType],
                        function(type) { return type == 'points'; }))
            { viewConfig._animation.direction = 'none'; }
            else if (mapObj.currentZoom() < mapObj._lastZoomLevel)
            { viewConfig._animation.direction = 'gather'; }
            else
            { viewConfig._animation.direction = 'spread'; }
        },

        runAnimation: function()
        {
            var mapObj = this;

            // If two views are going in different directions, we're kinda fucked anyways.
            var direction = _.detect(mapObj._byView, function(viewConfig)
                { return viewConfig._animation
                        && !viewConfig._animation.finished
                        && viewConfig._animation.direction != 'none'; });
            direction = ((direction || {})._animation || {}).direction;

            // Either there's only one view, or nothing is going to happen.
            if (!direction)
            {
                _.each(mapObj._byView, function(viewConfig)
                { viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds); });
                return;
            }

            var animKey  = direction == 'spread' ? 'news' : 'olds';
            var otherKey = direction == 'gather' ? 'news' : 'olds';
            var animations = _.reduce(mapObj._byView, function(memo, viewConfig)
            {
                if (!viewConfig._animation || viewConfig._animation.direction == 'none')
                { return memo; }

                return memo.concat(_.compact(_.map(viewConfig._animation[animKey],
                    function(feature)
                    {
                        if (!feature.attributes.clusterParent) { return; }

                        var animation = { duration: 1000 };
                        animation.feature = feature;
                        var otherNode = _.detect(viewConfig._animation[otherKey], function(m)
                        { return feature.attributes.clusterParent.id == m.attributes.clusterId; });

                        if (!otherNode && !$.subKeyDefined(feature, 'attributes.clusterParent'))
                        { return; }

                        var otherNodeLonLat =
                            new OpenLayers.LonLat(feature.attributes.clusterParent.centroid.lon,
                                                  feature.attributes.clusterParent.centroid.lat)
                                .transform(geographicProjection, mapObj.map.getProjectionObject());

                        if (direction == 'spread')
                        {
                            animation.from = otherNode
                                                ? otherNode.geometry.getBounds().getCenterLonLat()
                                                : otherNodeLonLat;
                            animation.to   = feature.geometry.getBounds().getCenterLonLat();
                        }
                        else
                        {
                            animation.to = otherNode
                                                ? otherNode.geometry.getBounds().getCenterLonLat()
                                                : otherNodeLonLat;
                            animation.from = feature.geometry.getBounds().getCenterLonLat();
                        }

                        return animation;
                    })));
            }, []);

            if (direction == 'spread')
            {
                _.each(mapObj._byView, function(viewConfig)
                {
                    viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds);
                    _.each(viewConfig._animation.news, function(feature)
                    { delete feature.style.display; });
                });
            }
            animate(animations, function() { _.each(mapObj._byView, function(viewConfig)
                {
                    viewConfig._displayLayer.removeFeatures(viewConfig._animation.olds);
                    _.each(viewConfig._animation.news, function(feature)
                    { viewConfig._displayLayer.drawFeature(feature); });
                    viewConfig._animation.finished = true;
                }); });
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
    }, {
        defaultZoom: 1,
        coordinatePrecision: 6,
        iconScaleFactor: 1.2
    }, 'socrataVisualization');

    var calculateSegmentSizes = function(mapObj, aggs)
    {
        _.each(aggs, function(a, cId)
        {
            var column = mapObj._primaryView.columnForID(cId);
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

    var onFeatureSelect = function(mapObj, feature, closeBoxCallback)
    {
        if ((feature.attributes || {}).redirects_to)
        { window.open(feature.attributes.redirects_to); return; }
        if (!feature.attributes.flyout)
        { return null; }

        if (mapObj._popup) { closeBoxCallback(); }

        var popup = new OpenLayers.Popup.FramedCloud(null,
            feature.geometry.getBounds().getCenterLonLat(), null,
            feature.attributes.flyout[0].innerHTML, null, true, closeBoxCallback);
        mapObj._popup = popup;
        mapObj.map.addPopup(popup);

        $('.olFramedCloudPopupContent .infoPaging a').click(function(event)
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
    };

    var onFeatureUnselect = function(mapObj)
    {
        mapObj.map.removePopup(mapObj._popup);
        mapObj._popup.destroy();
        mapObj._popup = null;
    };

    var iconCache = function(mapObj, url, feature, hasHighlight)
    {
        if (!mapObj._iconCache)
        { mapObj._iconCache = {}; }

        if (!url)
        { url = '/images/openlayers/marker.png'; }

        var key = url;
        if (hasHighlight) { key += '|highlight=true'; }

        if (!mapObj._iconCache[key])
        {
            mapObj._iconCache[key] = { externalGraphic: url, features: [] };
            var image = new Image();
            image.onload = function()
            {
                var sf = mapObj.settings.iconScaleFactor;
                var width = hasHighlight ? image.width * sf : image.width;
                var height = hasHighlight ? image.height * sf : image.height;

                $.extend(mapObj._iconCache[key], {
                    graphicWidth: width, graphicHeight: height,
                    graphicXOffset: -(width / 2), graphicYOffset: -height
                });

                var features = mapObj._iconCache[key].features.concat(feature);
                _.each(features, function(f)
                {
                    f.style = mapObj._iconCache[key];
                    if (f.layer) { f.layer.drawFeature(f); }
                });
                mapObj._iconCache[key].features = [];
            };
            image.src = url;
        }
        else
        { mapObj._iconCache[key].features.push(feature); }

        return mapObj._iconCache[key];
    };

    var findFeatureFromEvent = function(mapObj, evt)
    {
        return _(mapObj._displayLayers).chain()
            .map(function(layer)
                { return { layer: layer, feature: layer.getFeatureFromEvent(evt) }; })
            .reject(function(datum)
                { return !datum.feature; })
            .value();
    };

    var animate = function(animations, callback)
    {
        var startTime = $.now();
        var interval;
        var step = function()
        {
            if (requestAnimationFrame && animations.length > 0)
            { requestAnimationFrame( step ); }

            animations = _.reject(animations, function(animation, index)
            {
                if (!animation.finished)
                {
                    var p = ($.now() - startTime) / animation.duration;
                    animation.finished = p >= 1;
                    var delta = function(start, end)
                    {
                        var pos = ((-Math.cos(p*Math.PI)/2) + 0.5);
                        return start + ((end - start) * pos);
                    };
                    var lonlat = new OpenLayers.LonLat(
                                               delta(animation.from.lon, animation.to.lon),
                                               delta(animation.from.lat, animation.to.lat));
                    animation.feature.move(lonlat);
                    return false;
                }
                animation.feature.move(animation.to);
                if (_.isFunction(animation.callback))
                { animation.callback(); }
                return true;
            });

            if (animations.length == 0)
            {
                if (!requestAnimationFrame)
                { clearInterval( interval ); }
                if (_.isFunction(callback))
                { callback(); }
            }
        };
        if (requestAnimationFrame)
        { requestAnimationFrame( step ); }
        else
        { interval = setInterval( step, 13 ); }
    };

})(jQuery);
