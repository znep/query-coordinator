(function($)
{
    var MAP_TYPE = {
        'canada_provinces': {
            'jsonCache': function(config) { return "/geodata/canada.admin1.json"; }
        },
        'countries': {
            'jsonCache': function(config) { return "/geodata/esri_country_data.json"; },
            'zoom' : 1
        },
        'state': {
            'jsonCache': function(config) { return "/geodata/esri_state_data.json"; },
            'transformFeatures': {
                'Alaska': { 'scale': 0.6,
                    'offset': { 'x': 1950000, 'y': -4500000 } },
                'Hawaii': { 'scale': 1.2, 'offset': { 'x': 5000000, 'y': 800000 } }
                }
        },
        'counties': {
            'jsonCache': function(config)
                { return "/geodata/esri_county_"+config.region+".json"; }
        }
    };

    $.Control.registerMixin('boundary', {
        initializeLayer: function()
        {
            var layerObj = this;
            layerObj._super();

            layerObj.loadFeatures();
        },

        initializeColumns: function()
        {
            var layerObj = this;
            layerObj._super();
            layerObj._config = layerObj._displayFormat.heatmap;

            layerObj._config.aggregateMethod = (_.isUndefined(layerObj._quantityCol)
                || layerObj._quantityCol.id == 'fake_quantity') ?
                'count' : 'sum';

            // Fools everything depending on quantityCol into recognizing it as a Count
            if (layerObj._config.aggregateMethod == 'count')
            {
                layerObj._quantityCol = { 'id': 'fake_quantity', 'name': 'Count',
                    renderType: blist.datatypes.number, format: {} };
            }

            var colors = layerObj._config.colors || {};
            colors.high = colors.high || '#00ff00';
            colors.low  = colors.low  || '#c9c9c9';
            layerObj._gradient = _.map(
                    $.gradient(layerObj.settings.numSegments, [colors.high, colors.low]),
                    function(c) { return '#'+$.rgbToHex(c); });
        },

        ready: function()
        {
            return this._super() && this._featuresLoaded && this._dataInFeatures;
        },

        zoomToPreferred: function()
        {
            this._super();

            // Super special case just for Bug 7171.
            if (this._map.hasNoBackground && this._parent._children.length == 1
                && this.restrictPanning())
            { this._map.restrictPanningTo(this.preferredExtent()); }
        },

        discoverDisplayFormatChanges: function()
        {
            return $.extend(true, this._super(), {
                regions: { keys: ['heatmap.type', 'heatmap.region'],
                           onChange: this.reloadFeatures }
            });
        },

        loadFeatures: function()
        {
            var layerObj = this;

            // jQuery's AJAX methods aren't functioning and the clearest root cause
            // is that the JSON parser is running into a performance problem.
            // We're using Dojo here because ESRI does and its parser seems to
            // handle the demanded load fine.
            dojo.xhrGet({
                url: MAP_TYPE[layerObj._config.type].jsonCache(layerObj._config),
                handleAs: 'json',
                load: function(data, ioArgs) {
                    layerObj.handleFeaturesLoaded(data.features, data.displayFieldName);
                }
            });

            layerObj._loadingFeatures = true;

            layerObj._view.trigger('request_start');
            setTimeout(function()
            {
                // query took too long and probably timed out
                // so we're just going to kill the spinner and error it
                // if the query does finish, it will load behind the alert
                if (layerObj._loadingFeatures)
                {
                    layerObj._view.trigger('request_finish');
                    alert($.t('controls.map.data_request_timeout'));
                }
            }, 60000);
        },

        handleFeaturesLoaded: function(features, displayFieldName)
        {
            var layerObj = this, featuresReady = null;
            layerObj._featureSet = [];
            displayFieldName = displayFieldName || 'NAME';

            var arr = function(size, val)
                { var a = []; a.length = size; while(size--) { a[size] = val; } return a; };
            var arr2 = function(size, cls)
                { var a = []; a.length = size; while(size--) { a[size] = new cls(); } return a; };

            var convertPoint = function(point, pIndex, ring, ready)
            {
                ring.components[pIndex] = new OpenLayers.Geometry.Point(point[0], point[1]);

                ready[pIndex] = true;
            };

            var convertRing = function(ring, rIndex, feature, ready)
            {
                var pIndex = 0;
                feature.components[rIndex].components = arr2(ring.length, OpenLayers.Geometry.Point);
                ready[rIndex] = arr(ring.length, false);

                $.batchProcess(ring, 10, function(p)
                        { convertPoint(p, pIndex++, feature.components[rIndex], ready[rIndex]); },
                    null, function() {
                        var comps = feature.components[rIndex].components;
                        feature.components[rIndex].components = [];
                        feature.components[rIndex].addComponents(comps);
                    });
            };

            var fIndex = 0, convertFeature = function(feature)
            {
                var index = fIndex, f = layerObj._featureSet[fIndex], rIndex = 0;
                f.attributes.dupKey = f.dupKey
                    = feature.attributes.NAME || feature.attributes[displayFieldName];

                f.components = arr2(feature.geometry.rings.length, OpenLayers.Geometry.LinearRing);
                featuresReady[fIndex] = arr(feature.geometry.rings.length, false);
                $.batchProcess(feature.geometry.rings, 10,
                    function(r) { convertRing(r, rIndex++, f, featuresReady[index]); });

                fIndex++;
            };

            var onComplete = function()
            {
                layerObj._loadingFeatures = false;
                _.each(layerObj._featureSet, function(f) { f.componentsReady(); });

                layerObj.renderFeatures();

                if (layerObj._dataLoaded)
                { layerObj.handleDataLoaded(layerObj._view.loadedRows()); }
                else
                { layerObj.getData(); }

                layerObj._view.trigger('request_finish');
            };

            layerObj._featureSet = arr2(features.length, blist.openLayers.Polygon);
            featuresReady        = arr (features.length, false);
            $.batchProcess(features, 10, convertFeature);

            var collapseTruth = function(vector)
            { return vector === true || ((_.isArray(vector)) && _.all(vector, collapseTruth)); };

            var waitTimer = setInterval(function()
            {
                if (collapseTruth(featuresReady))
                { clearInterval(waitTimer); onComplete(); }
            }, 100);
        },

        reloadFeatures: function()
        {
            var layerObj = this;

            delete layerObj._featureSet;
            delete layerObj._loadingFeatures;
            layerObj._displayLayer.removeAllFeatures();
            layerObj.loadFeatures();
        },

        restrictPanning: function()
        {
            return this._config.type != 'countries';
        },

        legendData: function()
        {
            var layerObj = this, data = [];

            if ($.subKeyDefined(layerObj._view, 'metadata.conditionalFormatting'))
            {
                _.each(layerObj._view.metadata.conditionalFormatting, function(cf)
                {
                    if (!cf.description) { return; }

                    if (cf.color)
                    { data.push({ symbolType: 'oneColor', color: cf.color,
                                  description: cf.description, cf: true }) }
                    else if (cf.icon)
                    { data.push({ symbolType: 'icon', icon: cf.icon,
                                  description: cf.description, cf: true }) }
                });
            }
            if (layerObj._quantityCol && layerObj._range
                && ($.subKeyDefined(layerObj, '_quantityCol.aggregates.maximum')))
            {
                data.push({
                    symbolType:  'colorRange',
                    description: layerObj._quantityCol.name,
                    minimum:     layerObj._quantityCol.aggregates.minimum,
                    maximum:     layerObj._quantityCol.aggregates.maximum,
                    gradient:    layerObj._range
                });
            }

            return data;
        },

        // Make it so that it only highlights one row first in order to speed up highlighting
        // boundaries. Then highlight all rows so that the grid displays highlights correctly.
        highlightRows: function()
        {
            var args = [arguments[0][_.keys(arguments[0])[0]] || {}];
            this._super.apply(this, args);
            this._super.apply(this, arguments);
        },

        handleDataLoaded: function(rows)
        {
            var layerObj = this;
            if (layerObj._loadingFeatures)
            { return; }

            if (!layerObj._rowsProcessing) { layerObj._rowsProcessing = 0; }
            layerObj._rowsProcessing += _.size(rows);

            // Thinking about promoting this to base-datalayer...
            $.batchProcess(_.toArray(rows), 10, function(row) { layerObj.prepareRowRender(row); });

            var waiting = setInterval(function()
            {
                if (layerObj._rowsProcessing <= 0)
                {
                    clearInterval(waiting);
                    layerObj.renderFeatures();
                    layerObj._dataInFeatures = layerObj._dataLoaded;
                }
            }, 20);
        },

        prepareRowRender: function(row)
        {
            var layerObj = this;

            var geometry = layerObj.extractGeometryFromRow(row);
            if (_.isBoolean(geometry) || _.isString(geometry))
            { layerObj._rowsProcessing--; return null; }

            var feature;
            $.batchProcess(layerObj._featureSet, 3, function(polygon)
            {
                if (feature) { return; }
                if (polygon.attributes.dupKey == 'Hawaii'
                    && (polygon.attributes.oldGeometry || polygon)
                        .getBounds().toGeometry().containsPoint(geometry))
                { feature = polygon; }
                if ((polygon.attributes.oldGeometry || polygon).containsPoint(geometry))
                { feature = polygon; }
            }, null, function()
            {
                if (feature)
                {
                    feature.attributes.rows[row.id] = row;
                    if (layerObj._config.aggregateMethod == 'sum')
                    { feature.attributes.quantities[row.id]
                        = parseFloat(row.data[layerObj._quantityCol.lookup]); }
                    else
                    { feature.attributes.quantities[row.id] = 1; }
                }

                layerObj._rowsProcessing--;
            });
        },

        renderFeatures: function()
        {
            var layerObj = this;
            var features = layerObj._featureSet;

            // TODO: should probably be checking quantityPrecision?
            var quantities = _.map(features,
                function(feature) { return _.isEmpty(feature.attributes.quantities)
                    ? null
                    : _.reduce(feature.attributes.quantities,
                        function(memo, q) { return _.isNaN(q) ? memo : memo + q; }, 0); });
            var max = Math.max.apply(null, quantities);
            var min = Math.min.apply(null, quantities);
            var difference = max-min;
            if (difference > 0)
            {
                var granularity = difference/layerObj.settings.numSegments;
                layerObj._range = _.map(_.range(min, max, granularity), function(v, i)
                    { return { value: v + granularity, color: layerObj._gradient[i] }; });
                _.last(layerObj._range).value = max;
            }

            layerObj._quantityCol.aggregates = { maximum: max, minimum: min };
            layerObj._parent._controls.Overview.redraw();

            var index = 0;
            $.batchProcess(features, 10, function(feature)
            {
                var rows = feature.attributes.rows || [];
                var color;
                if (!_.isNull(quantities[index]))
                {
                    var segment = _.detect(layerObj._range,
                        function(segment) { return quantities[index] <= segment.value; });
                    if (segment) { color = segment.color; }
                }

                layerObj.renderDatum({ geometry: layerObj.transformFeature(feature),
                    dupKey: feature.dupKey, rows: _.toArray(rows), color: color
                });

                index++;
            }, null, function()
            {
                layerObj.zoomToPreferred();
                layerObj._featuresLoaded = true;
                layerObj._parent.mapElementLoaded(layerObj._displayLayer);
            });
        },

        removeDatum: function(datum)
        {
            var layerObj = this;

            var geometry = layerObj.extractGeometryFromRow(row);
            var feature = _.detect(layerObj._featureSet, function(polygon)
                { return polygon.containsPoint(geometry); });
            if ($.isBlank(feature)) { return; }

            delete feature.attributes.rows[row.id];
            if (!_.isEmpty(feature.attributes.quantities))
            { delete feature.attributes.quantities[row.id]; }
        },

        transformFeature: function(feature)
        {
            var layerObj = this;

            if (feature.attributes.oldGeometry) // Already transformed.
            { return feature; }

            var key = feature.attributes.dupKey;
            if (!$.subKeyDefined(MAP_TYPE[layerObj._config.type], 'transformFeatures.' + key))
            { return feature; }

            var transform;
            if (layerObj._config.transformFeatures)
            { transform = layerObj._config.transformFeatures[key]; }
            if (!transform)
            { transform = MAP_TYPE[layerObj._config.type].transformFeatures[key]; }
            if (!transform)
            { return feature; }

            feature.attributes.oldGeometry = feature.clone();
            var center = feature.getBounds().getCenterLonLat();
            center = new OpenLayers.Geometry.Point(center.lon, center.lat);

            if (transform.scale)
            { feature = feature.resize(transform.scale, center); }
            if (transform.offset)
            { feature.move(transform.offset.x, transform.offset.y); }
            feature.calculateBounds();

            return feature;
        },

        styleDatum: function(marker, datum)
        {
            var layerObj = this;

            var hasHighlight = _.any(datum.rows, function(r)
                { return r.sessionMeta && r.sessionMeta.highlight; });

            marker.style = marker.style || {};
            marker.style.strokeColor = '#000000';
            marker.style.strokeWidth = 2;
            if (datum.rows.length > 0)
            {
                marker.style.fillColor = hasHighlight ? layerObj._highlightColor
                                                      : datum.color;
                marker.style.fillOpacity = 0.8;
            }
            else
            { marker.style.fillOpacity = 0; }
        },

        clearData: function()
        {
            _.each(this._displayLayer.features, function(feature)
            {
                feature.attributes.rows = [];
                feature.geometry.attributes.rows = {};
                feature.geometry.attributes.quantities = {};
            });
            this.renderFeatures();
        }
    }, {}, 'socrataDataLayer', 'points');

})(jQuery);
