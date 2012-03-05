(function($)
{
    blist.openLayers.ExternalESRILayer = OpenLayers.Class(OpenLayers.Layer.ArcGIS93Rest, {
        initialize: function(name, url, params, options) {
            var layer = this;

            var properties = ['externalMapProjection', 'internalMapProjection', 'onloadCallback'];
            _.each(properties, function(property)
            {
                layer[property] = params[property];
                delete params[property];
            });
            this.layerId = params.layers.split(':')[1];
            if (url.match(/nycopendata.esri.com/)) // Hopefully, this can be taken out one day.
            { this.projection = this.internalMapProjection; }

            dojo.require('esri.arcgis.utils');
            dojo.require('esri.layers.FeatureLayer');
            dojo.addOnLoad(function()
            {
                var path = url.replace(/\/export$/,'');
                esri.arcgis.utils._getServiceInfo(path).addCallback(
                    function(layerInfo) { layer.setMetadata(layerInfo); });
                layer.featureLayer
                    = new esri.layers.FeatureLayer(path + '/' + layer.layerId);

                dojo.connect(layer.featureLayer, 'onLoad', function()
                {
                    if ($.subKeyDefined(layer, 'featureLayer.renderer.infos'))
                    {
                        layer._suggestedTolerance = Math.max.apply(null,
                            _(layer.featureLayer.renderer.infos).chain()
                            .map(function(info) { return [info.symbol.height, info.symbol.width]; })
                            .flatten().compact().value());
                    }

                    if (layer._metadataReady)
                    { layer.onloadCallback(); }
                    else
                    { layer._featureLayerReady = true; }
                });
            });

            OpenLayers.Layer.ArcGIS93Rest.prototype.initialize.apply(this, arguments);
        },

        setMetadata: function(metadata)
        {
            var layer = this;
            this.metadata = metadata;
            if (!this.externalMapProjection.proj.readyToUse)
            { this.externalMapProjection.proj.queue.push(function()
                { layer.setInitialExtent(); }); }
            else
            { this.setInitialExtent(); }
        },

        setInitialExtent: function()
        {
            this.initialExtent = this.convertEsriToOpenLayers(this.metadata.initialExtent);
            if (this._featureLayerReady)
            { this.onloadCallback(); }
            else
            { this._metadataReady = true; }
        },

        convertEsriToOpenLayers: function(bounds)
        {
            return new OpenLayers.Bounds(bounds.xmin, bounds.ymin, bounds.xmax, bounds.ymax)
                .transform(this.externalMapProjection, this.internalMapProjection);
        },

        getInitialExtent: function()
        {
            return this.initialExtent;
        },

        filterWith: function(view)
        {
            var layer = this;
            view.bind('query_change', function() { layer.setLayerFilter(layer.layerId,
                transformFilterToLayerDefinition(view, layer.featureLayer));
                layer.redraw();
            });
        },

        getURL: function(bounds) {
            bounds = this.adjustBounds(bounds);
            bounds = bounds.transform(this.projection, this.externalMapProjection);

            // ArcGIS Server only wants the numeric portion of the projection ID.
            var projWords = this.projection.getCode().split(":");
            var srid = projWords[projWords.length - 1];
            var imageSize = this.getImageSize();
            var newParams = {
                'BBOX': bounds.toBBOX(),
                'SIZE': imageSize.w + "," + imageSize.h,
                'F': "image",
                'BBOXSR': srid,
                'IMAGESR': srid
            };

            // Now add the filter parameters.
            if (this.layerDefs) {
                var layerDefStrList = [];
                var layerID;
                for(layerID in this.layerDefs) {
                    if (this.layerDefs.hasOwnProperty(layerID)) {
                        if (this.layerDefs[layerID]) {
                            layerDefStrList.push(layerID);
                            layerDefStrList.push(":");
                            layerDefStrList.push(this.layerDefs[layerID]);
                            layerDefStrList.push(";");
                        }
                    }
                }
                if (layerDefStrList.length > 0) {
                    newParams['LAYERDEFS'] = layerDefStrList.join("");
                }
            }
            var requestString = this.getFullRequestString(newParams);
            return requestString;
        }
    });

    // This entire file's purpose has been deprecated since we have GeometryType
    $.Control.registerMixin('arcGISmap', {
        getDataForAllViews: function()
        {
            var mapObj = this;
            mapObj._super();

            var viewsToRender = _.select(mapObj._dataViews, function(view)
                { return view.renderWithArcGISServer() });
            _.each(viewsToRender, function(view) {
                var layer = mapObj.buildViewLayer(view);
                mapObj.map.addLayer(layer);
            });
        },

        buildViewLayer: function(view)
        {
            var mapObj = this;
            var viewConfig = mapObj._byView[view.id];

            if (viewConfig._externalLayer)
            { return viewConfig._externalLayer; }

            var wkid;
            if (view.metadata.custom_fields.Basic['Spatial Reference wkid'])
            { wkid = 'EPSG:' + view.metadata.custom_fields.Basic['Spatial Reference wkid']; }
            else if (view.metadata.custom_fields.Basic['Spatial Reference wkt'])
            {
                if (view.displayFormat.projection)
                { viewConfig._externalLayer.externalMapProjection
                    = new OpenLayers.Projection('EPSG:' + view.displayFormat.projection); }
                else
                {
                    var url = '/proxy/wkt_to_wkid?wkt='
                    + encodeURI(blist.dataset.metadata.custom_fields.Basic['Spatial Reference wkt']);
                    $.getJSON(url, function(data) {
                        if (data.exact)
                        {
                            viewConfig._externalLayer.externalMapProjection
                                = new OpenLayers.Projection('EPSG:' + data.codes[0].code);
                            view.update({ displayFormat: $.extend({}, view.displayFormat,
                                { projection: data.codes[0].code }) }, false, false);
                            view.save();
                        }
                    });
                }
            }

            var opacity;
            if ($.subKeyDefined(view, 'metadata.custom_fields.drawingInfo.transparency'))
            { opacity = parseInt(view.metadata.custom_fields.drawingInfo.transparency, 10) / 100; }
            if (opacity == 0) // ArcGIS Server defaults transparency to 0, resulting in many datasets
            { opacity = 1; }  // created with this default when they don't mean it.

            var tmp = view.metadata.custom_fields.Basic.Source.split('/');
            var layer_id = tmp.pop();
            var url = tmp.join('/') + '/export';
            var layer = viewConfig._externalLayer
                = new blist.openLayers.ExternalESRILayer( view.metadata.custom_fields.Basic.Source,
                    url,
                    { layers: "show:"+layer_id, transparent: true,
                      internalMapProjection: mapObj.map.getProjectionObject(),
                      externalMapProjection: wkid && new OpenLayers.Projection(wkid),
                      onloadCallback: function() {
                        if (viewConfig._identifyParameters && layer._suggestedTolerance)
                        { viewConfig._identifyParameters.tolerance = layer._suggestedTolerance; }
                        layer.filterWith(view); mapObj.adjustBounds();
                        delete mapObj._initialLoad;
                      }
                    },
                    { opacity: opacity, ratio: 1, isBaseLayer: false });

            layer.events.register('loadend', mapObj, mapObj.mapElementLoaded);

            var symbolSize = 3;
            if (view.metadata.custom_fields['drawingInfo.renderer'])
            {
                var symbolDimensions = [symbolSize];
                if (view.metadata.custom_fields['drawingInfo.renderer']['symbol.width'])
                { symbolDimensions.push(parseInt(
                    view.metadata.custom_fields['drawingInfo.renderer']['symbol.width']), 10); }
                if (view.metadata.custom_fields['drawingInfo.renderer']['symbol.height'])
                { symbolDimensions.push(parseInt(
                    view.metadata.custom_fields['drawingInfo.renderer']['symbol.height']), 10); }
                symbolSize = Math.max.apply(null, symbolDimensions);
            }
            if (viewConfig._externalLayer._suggestedTolerance)
            { symbolSize = Math.max(symbolSize, viewConfig._externalLayer._suggestedTolerance); }

            viewConfig._identifyParameters = new esri.tasks.IdentifyParameters();
            viewConfig._identifyParameters.tolerance = symbolSize;
            viewConfig._identifyParameters.returnGeometry = true;
            viewConfig._identifyParameters.layerOption =
                esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
            viewConfig._identifyParameters.width  = mapObj.map.getSize().w;
            viewConfig._identifyParameters.height = mapObj.map.getSize().h;
            viewConfig._identifyParameters.layerIds = [layer.layerId];

            mapObj.map.events.register('click', layer, function(evt)
            {
                var pixel = mapObj.map.events.getMousePosition(evt);
                var sr = new esri.SpatialReference({ wkid: mapObj.map.getProjection().split(':')[1]});
                var lonlat = layer.getLonLatFromViewPortPx(pixel);
                var geometry = new esri.geometry.Point(lonlat.lon, lonlat.lat, sr);

                // On first load, the map is offset somehow.
                pixel.y = mapObj.map.getSize().h / 2;
                var offsetLat = layer.getLonLatFromViewPortPx(pixel).lat - mapObj.map.getCenter().lat;
                viewConfig._offsetLat = offsetLat;
                geometry.y -= offsetLat;
                var extent = layer.getExtent();
                extent = new esri.geometry.Extent(extent.left, extent.bottom + offsetLat,
                                                  extent.right, extent.top + offsetLat);

                var layerDefs = [];
                if (layer.layerDefs)
                { for (var i in layer.layerDefs) { layerDefs[i] = layer.layerDefs[i]; } }

                viewConfig._identifyParameters.geometry = geometry;
                viewConfig._identifyParameters.mapExtent = extent;
                viewConfig._identifyParameters.layerDefinitions = layerDefs;

                lonlat.lat -= offsetLat;
                mapObj.showPopup(lonlat, 'Loading...');

                new esri.tasks.IdentifyTask(url.replace(/\/export$/, ''))
                    .execute(viewConfig._identifyParameters, function(idResults)
                    {
                        if (_.isEmpty(idResults)) { mapObj.closePopup(); return; }

                        var flyoutContent = mapObj.getFlyout(_.map(idResults,
                            function(res) { return res.feature; }), {}, view);
                        if (flyoutContent)
                        { flyoutContent = flyoutContent[0].innerHTML; }

                        mapObj.showPopup(lonlat, flyoutContent);
                    },
                    function(error)
                    {
                        if (error.dojoType == 'timeout')
                        { mapObj.showPopup(lonlat, 'Request for this data timed out.'); }
                    });
            });

            view.trigger('row_count_change');

            return layer;
        },

        adjustBounds: function()
        {
            var mapObj = this;
            var bounds = _.reduce(mapObj._byView, function(memo, viewConfig)
                {
                    if (viewConfig._externalLayer)
                    { memo.extend(viewConfig._externalLayer.getInitialExtent()); }
                    return memo;
                }, new OpenLayers.Bounds());
            mapObj.map.zoomToExtent(bounds);
        },

        getFlyout: function(features, details, dataView)
        {
            var attrMap = {};
            _.each(dataView.realColumns, function(col)
            {
                attrMap[col.name] = col.lookup;
                attrMap[col.description] = col.lookup;
            });

            var rows = _.map(features, function(feature)
            {
                var row = {};
                _.each(feature.attributes, function(val, attr)
                { row[attrMap[attr]] = val; });
                return row;
            });

            return this._super(rows, details, dataView);
        }

    }, { showRowLink: false }, 'socrataMap');

    var transformFilterToLayerDefinition = function(view, featureLayer)
    {
        var applyFilters = function()
        {
            var filterCond = view.cleanFilters(true);
            if (_.isEmpty(filterCond)) { return '1=1'; }

            var template = {
                'EQUALS':                 '<%= field %> = <%= val1 %>',
                'NOT_EQUALS':             '<%= field %> != <%= val1 %>',
                'STARTS_WITH':            '<%= field %> LIKE \'<%= val1 %>%\'',
                'CONTAINS':               '<%= field %> LIKE \'%<%= val1 %>%\'',
                'NOT_CONTAINS':           '<%= field %> NOT LIKE \'%<%= val1 %>%\'',
                'IS_NOT_BLANK':           '<%= field %> IS NOT NULL',
                'IS_BLANK':               '<%= field %> IS NULL',
                'LESS_THAN':              '<%= field %> < <%= val1 %>',
                'LESS_THAN_OR_EQUALS':    '<%= field %> <= <%= val1 %>',
                'GREATER_THAN':           '<%= field %> > <%= val1 %>',
                'GREATER_THAN_OR_EQUALS': '<%= field %> >= <%= val1 %>',
                'BETWEEN':
                    '<%= field %> BETWEEN <%= val1 %> AND <%= val2 %>'
            };
            var transformFilterToSQL = function (filter)
            {
                var fieldName = processFilter(filter.children[0]);
                var field = _.detect(featureLayer.fields,
                    function(field) { return field.name == fieldName });

                var value = [];
                value.push(processFilter(filter.children[1]));
                value.push(processFilter(filter.children[2]));
                value = _.compact(value);

                // From http://help.arcgis.com/EN/webapi/javascript/arcgis/help/jsapi/field.htm#type
                // Can be one of the following:
                // "esriFieldTypeSmallInteger", "esriFieldTypeInteger",
                // "esriFieldTypeSingle",       "esriFieldTypeDouble",
                // "esriFieldTypeString",       "esriFieldTypeDate",
                // "esriFieldTypeOID",          "esriFieldTypeGeometry",
                // "esriFieldTypeBlob",         "esriFieldTypeRaster",
                // "esriFieldTypeGUID",         "esriFieldTypeGlobalID",
                // "esriFieldTypeXML"

                // TODO: Need to figure out which types are PostgreSQL strings.
                if (_.include(["String"], field.type.substr(13))
                    && !_.include(['STARTS_WITH', 'CONTAINS', 'NOT_CONTAINS'],
                                  filter.value))
                { value = _.map(value, function(v)
                    { return "'" + v.toString().replace(/'/g, "\\'") + "'"; }); }
                else
                { value = _.map(value, function(v)
                    { return v.toString().replace(/;.*$/, ''); }); }

                return _.template(template[filter.value],
                    {field: fieldName, val1: value[0], val2: value[1] });
            };
            var processFilter = function(filter)
            {
                if (!filter) { return null; }
                switch (filter.type)
                {
                    case 'operator':
                        switch(filter.value)
                        {
                            case 'AND':
                                return _.compact(_.map(filter.children, function(filter)
                                    { return processFilter(filter); })).join(' AND ');
                            case 'OR':
                                return _.compact(_.map(filter.children, function(filter)
                                    { return processFilter(filter); })).join(' OR ');
                            default:
                                return transformFilterToSQL(filter);
                        }
                        break;
                    case 'column':
                        return blist.dataset.columnForID(filter.columnId).name;
                    case 'literal':
                        return filter.value;
                }
            };
            return processFilter(filterCond);
        };
        return applyFilters();
    };

})(jQuery);
