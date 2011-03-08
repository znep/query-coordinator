(function($)
{
    if (!$.socrataMap.mixin) { $.socrataMap.mixin = function() { }; }
    $.socrataMap.mixin.arcGISmap = function() { };

    // This entire file's purpose has been deprecated since we have GeometryType
    $.extend($.socrataMap.mixin.arcGISmap.prototype,
    {
        _attachMapServer: function(view)
        {
            var mapObj = this;

            var tmp = view.metadata.custom_fields.Basic.Source.split('/');
            var layer_id = tmp.pop();
            var url = tmp.join('/');

            var viewConfig = mapObj._byView[view.id];

            viewConfig.mapServer = new esri.layers.
                ArcGISDynamicMapServiceLayer(url + '?srs=EPSG:102100');
            dojo.connect(viewConfig.mapServer, 'onLoad', function()
            { completeInitialization(mapObj, viewConfig, this, layer_id); });
        },

//        This is not worth supporting at the moment.
//        populateDataLayers: function()
//        {
//            var mapObj = this;
//            var layers = mapObj.mapServer.layerInfos;
//            if (layers.length < 2) { return; }
//
//            if (mapObj.$dom().siblings('#mapLayers').length > 0)
//            {
//                mapObj.$dom().parent().find('.toggleLayers, .contentBlock h3')
//                    .text('Data Layers');
//            }
//
//            var $layers = mapObj.$dom().siblings('#mapLayers');
//            var $layersList = $layers.find('ul');
//            $layersList.empty();
//
//            var isVisible = function(layerId)
//            { return _.include(mapObj.mapServer.visibleLayers, layerId.toString()); };
//            _.each(layers, function(l)
//            {
//                var lId = 'mapLayer_' + l.id;
//                $layersList.append('<li data-layerid="' + l.id + '"' +
//                    '><input type="checkbox" id="' + lId +
//                    '"' + (isVisible(l.id) ? ' checked="checked"' : '') +
//                    ' /><label for="' + lId + '">' + l.name + '</label><br />' +
//                    '</li>');
//            });
//
//            $layers.find(':checkbox').click(function(e)
//            {
//                var $check = $(e.currentTarget);
//                var id = $check.attr('id').replace(/^mapLayer_/, '');
//                if ($check.value())
//                { mapObj.mapServer.setVisibleLayers(
//                    mapObj.mapServer.visibleLayers.concat(id)); }
//                else
//                { mapObj.mapServer.setVisibleLayers(
//                    _.without(mapObj.mapServer.visibleLayers, id)); }
//            });
//
//            $layers.removeClass('hide');
//        }

    });

    var completeInitialization = function(mapObj, viewConfig, layer, layer_id)
    {
        viewConfig.view.trigger('row_count_change');

        transformFilterToLayerDefinition(viewConfig.view, layer, layer_id);
        viewConfig.view.bind('query_change', function()
        { transformFilterToLayerDefinition(viewConfig.view, layer, layer_id); });

        // If the primary dataset (which controls viewport) is server-rendered,
        // use the server rendered bounds.
        if (mapObj.settings.view.renderWithArcGISServer()
            && mapObj.settings.view.id == viewConfig.view.id)
        { adjustBounds(mapObj); }

        layer.setVisibleLayers([layer_id]);
        mapObj.map.addLayer(layer);

        if (mapObj.settings.view.id != viewConfig.view.id
            && mapObj.settings.view.renderWithArcGISServer())
        { mapObj.map.reorderLayer(layer, mapObj.map.layerIds.length - 2); }

        //mapObj.populateDataLayers();

        if (mapObj.settings.view.id != viewConfig.view.id)
        { return; }

        viewConfig.mapServer.featureLayers = [new esri.layers.FeatureLayer(
            viewConfig.mapServer._url.path + '/' +
            viewConfig.mapServer.layerInfos[layer_id].id)];

        viewConfig._identifyConfig = {
            url: viewConfig.mapServer._url.path,
            attributes: []
        };

        var featureLayersLoaded = 0;
        _.each(viewConfig.mapServer.featureLayers, function(featureLayer)
            {
                dojo.connect(featureLayer, 'onLoad', function()
                {
                    viewConfig._identifyConfig.attributes[featureLayer.layerId] = _.map(
                        featureLayer.fields, function(field)
                        { return {key:field.name, text:field.alias}; });
                    featureLayersLoaded++;

                    if (featureLayersLoaded >=viewConfig.mapServer.featureLayers.length)
                    {
                        dojo.connect(mapObj.map, 'onClick', function(evt)
                            { identifyFeature(mapObj, viewConfig, evt) });
                    }
                });
            });

        viewConfig._identifyParameters = new esri.tasks.IdentifyParameters();
        viewConfig._identifyParameters.tolerance = 3;
        viewConfig._identifyParameters.returnGeometry = false;
        viewConfig._identifyParameters.layerOption =
            esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        viewConfig._identifyParameters.width  = mapObj.map.width;
        viewConfig._identifyParameters.height = mapObj.map.height;
    };

    var adjustBounds = function(mapObj)
    {
        var encodeExtentToPoints = function(extent)
        { return [
            new esri.geometry.Point(extent.xmin, extent.ymin, extent.spatialReference),
            new esri.geometry.Point(extent.xmax, extent.ymax, extent.spatialReference)
            ];
        };
        var decodeExtentFromPoints = function(points)
        { return new esri.geometry.Extent(points[0].x, points[0].y,
                                          points[1].x, points[1].y,
                                          points[0].spatialReference);
        };
        new esri.tasks.GeometryService('http://sampleserver1.arcgisonline.com/' +
            'ArcGIS/rest/services/Geometry/GeometryServer')
            .project(encodeExtentToPoints(
                mapObj._byView[mapObj.settings.view.id].mapServer.initialExtent),
                     mapObj.map.spatialReference,
                     function(points)
                     { mapObj.map.setExtent(decodeExtentFromPoints(points)); }
            );
    };

    var identifyFeature = function(mapObj, viewConfig, evt)
    {
        if (!viewConfig._identifyParameters) { return; }
        viewConfig._identifyParameters.geometry = evt.mapPoint;
        viewConfig._identifyParameters.mapExtent = mapObj.map.extent;
        viewConfig._identifyParameters.layerIds = viewConfig.mapServer.visibleLayers;
        viewConfig._identifyParameters.layerDefinitions =
            viewConfig.mapServer.layerDefinitions;

        mapObj.map.infoWindow.setContent("Loading...").setTitle('')
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));

        new esri.tasks.IdentifyTask(viewConfig._identifyConfig.url)
            .execute(viewConfig._identifyParameters, function(idResults)
                { displayIdResult(mapObj, viewConfig, evt, idResults[0]); });
    };

    // Multiple results may have returned, but we only view the first one.
    var displayIdResult = function(mapObj, viewConfig, evt, idResult)
    {
        if (!idResult)
        {
            mapObj.map.infoWindow.hide();
            return;
        }

        var feature = idResult.feature;
        var info = _.map(viewConfig._identifyConfig.attributes[idResult.layerId],
            function(attribute)
            { return attribute.text + ': ' +
                feature.attributes[attribute.key]; }).join('<br />');

        mapObj.map.infoWindow.setContent(info)
            .setTitle(feature.attributes[idResult.displayFieldName])
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));
    };

    var transformFilterToLayerDefinition = function(view, layer, layer_id)
    {
        var applyFilters = function()
        {
            var filterCond = view.query.filterCondition;
            if (_.isEmpty(filterCond)) { return '1=1'; }

            var template = {
                'EQUALS':                 '<%= field %> = <%= val1 %>',
                'NOT_EQUALS':             '<%= field %> != <%= val1 %>',
                'STARTS_WITH':            '<%= field %> LIKE \'<%= val1 %>%\'',
                'CONTAINS':               '<%= field %> LIKE \'%<%= val1 %>%\'',
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
                var field = _.detect(layer.featureLayers[layer_id].fields,
                    function(field) { return field.name == fieldName });

                var value = [];
                value.push(processFilter(filter.children[1]));
                value.push(processFilter(filter.children[2]));

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
                    && !_.include(['STARTS_WITH', 'CONTAINS'], filter.value))
                { value = _.map(value, function(v)
                    { return "'" + v.replace(/'/g, "\\'") + "'"; }); }
                else
                { value = _.map(value, function(v) { return v.replace(/;.*$/, ''); }) }

                return _.template(template[filter.value],
                    {field: fieldName, val1: value[0], val2: value[1] });
            };
            var processFilter = function(filter)
            {
                if (!filter) { return ''; }
                switch (filter.type)
                {
                    case 'operator':
                        switch(filter.value)
                        {
                            case 'AND':
                                return _.map(filter.children, function(filter)
                                    { return processFilter(filter); }).join(' AND ');
                            case 'OR':
                                return _.map(filter.children, function(filter)
                                    { return processFilter(filter); }).join(' OR ');
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

        var ld = [];
        ld[layer_id] = applyFilters();
        layer.setLayerDefinitions(ld);
    };

})(jQuery);
