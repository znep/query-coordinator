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

            var colors = layerObj._config.colors
                && [layerObj._config.colors.high, layerObj._config.colors.low];
            if (_.isEmpty(_.compact(colors)))
            { colors = layerObj._displayFormat.color || '#0000ff'; }
            layerObj._gradient = _.map($.gradient(layerObj.settings.numSegments, colors),
                    function(c) { return '#'+$.rgbToHex(c); });
        },

        ready: function()
        {
            return this._super() && this._featuresLoaded;
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
                    layerObj._featureSet = reClassifyFeatures(data.features,
                        data.displayFieldName);
                    layerObj._loadingFeatures = false;
                    layerObj.renderFeatures(layerObj._featureSet);
                    layerObj.getData();
                    layerObj._view.trigger('request_finish');
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
                    alert('A data request has taken too long and timed out.');
                }
            }, 60000);
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
            var layerObj = this;
            if (!layerObj._quantityCol || !layerObj._range) { return; }
            if (!$.subKeyDefined(layerObj, '_quantityCol.aggregates.maximum')) { return; }

            return { name: layerObj._quantityCol.name,
                minimum: layerObj._quantityCol.aggregates.minimum,
                maximum: layerObj._quantityCol.aggregates.maximum,
                gradient: layerObj._range
            };
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

            // Thinking about promoting this to base-datalayer...
            var updatedFeatures = [];
            $.batchProcess(_.toArray(rows), 10,
                function(row, i) { return layerObj.prepareRowRender(row); },
                function(batch) { updatedFeatures = updatedFeatures.concat(_.compact(batch)); },
                function() { layerObj.renderFeatures(updatedFeatures); });
        },

        prepareRowRender: function(row)
        {
            var layerObj = this;

            var geometry = layerObj.extractGeometryFromRow(row);
            var feature = _.detect(layerObj._featureSet, function(polygon)
                { return polygon.containsPoint(geometry); });
            if (!feature) { return; }

            feature.attributes.rows[row.id] = row;
            if (layerObj._config.aggregateMethod == 'sum')
            { feature.attributes.quantities[row.id]
                = parseFloat(row[layerObj._quantityCol.lookup]); }
            else
            { feature.attributes.quantities[row.id] = 1; }

            return feature;
        },

        renderFeatures: function(updatedFeatures)
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

            _.each(features, function(feature, index)
            {
                if (updatedFeatures && !_.include(updatedFeatures, feature))
                { return; }

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
            });

            layerObj.zoomToPreferred();
            layerObj._featuresLoaded = true;
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

            if (feature.attributes.oldGeometry) // Already transformed.
            { return feature; }

            feature.attributes.oldGeometry = feature.clone();
            var center = feature.getBounds().getCenterLonLat();
            center = new OpenLayers.Geometry.Point(center.lon, center.lat);

            for (var r = 0; r < feature.components.length; r++)
            {
                if (transform.scale)
                { feature.components[r].resize(transform.scale, center); }
                if (transform.offset)
                { feature.components[r].move(transform.offset.x, transform.offset.y); }
            }

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
        }
    }, {}, 'socrataDataLayer', 'points');

    var reClassifyFeatures = function(features, displayFieldName)
    {
        displayFieldName = displayFieldName || 'NAME';
        return _.map(features, function(feature)
            { var f = new blist.openLayers.Polygon(_.map(feature.geometry.rings, function(ring)
                { return new OpenLayers.Geometry.LinearRing(_.map(ring, function(point)
                { return new OpenLayers.Geometry.Point(point[0], point[1]); })); }));
                f.dupKey = feature.attributes.NAME || feature.attributes[displayFieldName];
                f.attributes.dupKey = f.dupKey;
                return f;
            });
    };
})(jQuery);
