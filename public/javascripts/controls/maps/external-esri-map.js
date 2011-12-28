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
            this.metadata = metadata;
            this.initialExtent = this.convertEsriToOpenLayers(metadata.initialExtent);
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

            var wkid;
            if (view.metadata.custom_fields.Basic['Spatial Reference wkid'])
            { wkid = 'EPSG:' + view.metadata.custom_fields.Basic['Spatial Reference wkid']; }
            else if (view.metadata.custom_fields.Basic['Spatial Reference wkt'])
            {
                var url = '/admin/wkt_to_wkid?wkt='
                    + encodeURI(blist.dataset.metadata.custom_fields.Basic['Spatial Reference wkt']);
                $.getJSON(url, function(data) {
                    if (data.exact)
                    { viewConfig._externalLayer.externalMapProjection
                        = new OpenLayers.Projection('EPSG:' + data.codes[0].code); }
                });
            }

            var tmp = view.metadata.custom_fields.Basic.Source.split('/');
            var layer_id = tmp.pop();
            var url = tmp.join('/') + '/export';
            var layer = viewConfig._externalLayer
                = new blist.openLayers.ExternalESRILayer( view.metadata.custom_fields.Basic.Source,
                    url,
                    { layers: "show:"+layer_id, transparent: true,
                      internalMapProjection: mapObj.map.getProjectionObject(),
                      externalMapProjection: wkid && new OpenLayers.Projection(wkid),
                      onloadCallback: function() { layer.filterWith(view); mapObj.adjustBounds(); }
                    },
                    { ratio: 1, isBaseLayer: false });

            viewConfig._identifyParameters = new esri.tasks.IdentifyParameters();
            viewConfig._identifyParameters.tolerance = 3;
            viewConfig._identifyParameters.returnGeometry = true;
            viewConfig._identifyParameters.layerOption =
                esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
            viewConfig._identifyParameters.width  = mapObj.map.getSize().w;
            viewConfig._identifyParameters.height = mapObj.map.getSize().h;
            viewConfig._identifyParameters.layerIds = [layer.layerId];

            mapObj.map.events.register('click', layer, function(evt)
            {
                // Basically, toss out clicks that aren't on tiles.
                if (evt.originalTarget.parentNode
                    && evt.originalTarget.parentNode.parentNode != layer.div) { return; }

                var offsetTop = $(layer.div).offset().top;
                var sr = new esri.SpatialReference({ wkid: mapObj.map.getProjection().split(':')[1]});
                var lonlat = layer.getLonLatFromViewPortPx(
                    new OpenLayers.Pixel(evt.clientX, evt.clientY + offsetTop));
                var geometry = new esri.geometry.Point(lonlat.lon, lonlat.lat, sr);
                var extent = mapObj.map.getExtent();
                extent = new esri.geometry.Extent(extent.left, extent.bottom,
                                                  extent.right, extent.top);
                var layerDefs = [];
                if (layer.layerDefs)
                { for (var i in layer.layerDefs) { layerDefs[i] = layer.layerDefs[i]; } }

                viewConfig._identifyParameters.geometry = geometry;
                viewConfig._identifyParameters.mapExtent = extent;
                viewConfig._identifyParameters.layerDefinitions = layerDefs;

                new esri.tasks.IdentifyTask(url.replace(/\/export$/, ''))
                    .execute(viewConfig._identifyParameters, function(idResults)
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

                        var flyoutContent = mapObj.getFlyout(_.map(idResults,
                            function(res) { return res.feature; }), {}, view);
                        if (flyoutContent)
                        { flyoutContent = flyoutContent[0].innerHTML; }

                        // FIXME: There is some randomly occuring bug where this.size is not set.
                        // I haven't found how this can occur yet; it's probably a bug in OpenLayers.
                        var popup = new OpenLayers.Popup.FramedCloud(null,
                            lonlat, null, flyoutContent, null, true, closeBox);
                        viewConfig._popup = popup;
                        mapObj.map.addPopup(popup);
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
            { attrMap[col.name] = col.lookup; });

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
