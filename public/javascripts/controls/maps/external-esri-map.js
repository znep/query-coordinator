(function($)
{
    if (!$.socrataMap.mixin) { $.socrataMap.mixin = function() { }; }
    $.socrataMap.mixin.arcGISmap = function() { };

    // This entire file's purpose has been deprecated since we have GeometryType
    $.extend($.socrataMap.mixin.arcGISmap.prototype,
    {
        _attachMapServer: function()
        {
            var mapObj = this;

            var tmp = mapObj.settings.view.metadata
                .custom_fields.Basic.Source.split('/');
            var layer_id = tmp.pop();
            var url = tmp.join('/');

            mapObj.mapServer = new esri.layers.
                ArcGISDynamicMapServiceLayer(url + '?srs=EPSG:102100');
            dojo.connect(mapObj.mapServer, 'onLoad', function()
            { completeInitialization(mapObj, this, layer_id); });
        },

        populateDataLayers: function()
        {
            var mapObj = this;
            var layers = mapObj.mapServer.layerInfos;
            if (layers.length < 2) { return; }

            if (mapObj.$dom().siblings('#mapLayers').length > 0)
            {
                mapObj.$dom().parent().find('.toggleLayers, .contentBlock h3')
                    .text('Data Layers');
            }

            var $layers = mapObj.$dom().siblings('#mapLayers');
            var $layersList = $layers.find('ul');
            $layersList.empty();

            var isVisible = function(layerId)
            { return _.include(mapObj.mapServer.visibleLayers, layerId.toString()); };
            _.each(layers, function(l)
            {
                var lId = 'mapLayer_' + l.id;
                $layersList.append('<li data-layerid="' + l.id + '"' +
                    '><input type="checkbox" id="' + lId +
                    '"' + (isVisible(l.id) ? ' checked="checked"' : '') +
                    ' /><label for="' + lId + '">' + l.name + '</label><br />' +
                    '</li>');
            });

            $layers.find(':checkbox').click(function(e)
            {
                var $check = $(e.currentTarget);
                var id = $check.attr('id').replace(/^mapLayer_/, '');
                if ($check.value())
                { mapObj.mapServer.setVisibleLayers(
                    mapObj.mapServer.visibleLayers.concat(id)); }
                else
                { mapObj.mapServer.setVisibleLayers(
                    _.without(mapObj.mapServer.visibleLayers, id)); }
            });

            $layers.removeClass('hide');
        }

    });

    var completeInitialization = function(mapObj, layer, layer_id)
    {
        mapObj.settings.view.trigger('row_count_change');

        transformFilterToLayerDefinition(mapObj, layer, layer_id);
        mapObj.settings.view.bind('query_change', function()
        { transformFilterToLayerDefinition(mapObj, layer, layer_id); });

        layer.setVisibleLayers([layer_id]);
        mapObj.map.addLayer(layer);
    
        mapObj.mapServer.featureLayers = _.map(mapObj.mapServer.layerInfos,
            function(layerInfo)
            { return new esri.layers.FeatureLayer(
                mapObj.mapServer._url.path + '/' + layerInfo.id); });

        if (mapObj.map.layerIds.length == 1)
        { adjustBounds(mapObj); }

        //mapObj.populateDataLayers();

        mapObj._identifyConfig = {
            url: mapObj.mapServer._url.path,
            attributes: []
        };

        var featureLayersLoaded = 0;
        _.each(mapObj.mapServer.featureLayers, function(featureLayer, index)
            {
                dojo.connect(featureLayer, 'onLoad', function()
                {
                    mapObj._identifyConfig.attributes[index] = _.map(
                        featureLayer.fields, function(field)
                        { return {key:field.name, text:field.alias}; });
                    featureLayersLoaded++;

                    if (featureLayersLoaded >= mapObj.mapServer.featureLayers.length)
                    {
                        dojo.connect(mapObj.map, 'onClick', function(evt)
                            { identifyFeature(mapObj, evt) });
                    }
                });
            });

        mapObj._identifyParameters = new esri.tasks.IdentifyParameters();
        mapObj._identifyParameters.tolerance = 3;
        mapObj._identifyParameters.returnGeometry = false;
        mapObj._identifyParameters.layerOption =
            esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        mapObj._identifyParameters.width  = mapObj.map.width;
        mapObj._identifyParameters.height = mapObj.map.height;
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
            .project(encodeExtentToPoints(mapObj.mapServer.initialExtent),
                     mapObj.map.spatialReference,
                     function(points)
                     { mapObj.map.setExtent(decodeExtentFromPoints(points)); }
            );
    };

    var identifyFeature = function(mapObj, evt)
    {
        if (!mapObj._identifyParameters) { return; }
        mapObj._identifyParameters.geometry = evt.mapPoint;
        mapObj._identifyParameters.mapExtent = mapObj.map.extent;
        mapObj._identifyParameters.layerIds = mapObj.mapServer.visibleLayers;
        mapObj._identifyParameters.layerDefinitions = mapObj.mapServer.layerDefinitions;

        mapObj.map.infoWindow.setContent("Loading...").setTitle('')
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));

        new esri.tasks.IdentifyTask(mapObj._identifyConfig.url)
            .execute(mapObj._identifyParameters,
            function(idResults) { displayIdResult(mapObj, evt, idResults[0]); });
    };

    // Multiple results may have returned, but we only view the first one.
    var displayIdResult = function(mapObj, evt, idResult)
    {
        if (!idResult)
        {
            mapObj.map.infoWindow.hide();
            return;
        }

        var feature = idResult.feature;
        var info = _.map(mapObj._identifyConfig.attributes[idResult.layerId],
            function(attribute)
            { return attribute.text + ': ' +
                feature.attributes[attribute.key]; }).join('<br />');

        mapObj.map.infoWindow.setContent(info)
            .setTitle(feature.attributes[idResult.displayFieldName])
            .show(evt.screenPoint, mapObj.map.getInfoWindowAnchor(evt.screenPoint));
    };

    var transformFilterToLayerDefinition = function(mapObj, layer, layer_id)
    {
        var applyFilters = function()
        {
            var filterCond = mapObj.settings.view.query.filterCondition;
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
