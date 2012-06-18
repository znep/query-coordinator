(function($)
{
    var STATE_ABBREV = {
        'alabama': 'AL',
        'alaska': 'AK',
        'arizona': 'AZ',
        'arkansas': 'AR',
        'california': 'CA',
        'colorado': 'CO',
        'connecticut': 'CT',
        'delaware': 'DE',
        'district of columbia': 'DC',
        'florida': 'FL',
        'georgia': 'GA',
        'hawaii': 'HI',
        'idaho': 'ID',
        'illinois': 'IL',
        'indiana': 'IN',
        'iowa': 'IA',
        'kansas': 'KS',
        'kentucky': 'KY',
        'louisiana': 'LA',
        'maine': 'ME',
        'maryland': 'MD',
        'massachusetts': 'MA',
        'michigan': 'MI',
        'minnesota': 'MN',
        'mississippi': 'MS',
        'missouri': 'MO',
        'montana': 'MT',
        'nebraska': 'NE',
        'nevada': 'NV',
        'new hampshire': 'NH',
        'new jersey': 'NJ',
        'new mexico': 'NM',
        'new york': 'NY',
        'north carolina': 'NC',
        'north dakota': 'ND',
        'ohio': 'OH',
        'oklahoma': 'OK',
        'oregon': 'OR',
        'pennsylvania': 'PA',
        'rhode island': 'RI',
        'south carolina': 'SC',
        'south dakota': 'SD',
        'tennessee': 'TN',
        'texas': 'TX',
        'utah': 'UT',
        'vermont': 'VT',
        'virginia': 'VA',
        'washington': 'WA',
        'west virginia': 'WV',
        'wisconsin': 'WI',
        'wyoming': 'WY'
    };

    blist.openLayers.Polygon = OpenLayers.Class(OpenLayers.Geometry.Polygon, {
        initialize: function()
        {
            OpenLayers.Geometry.Polygon.prototype.initialize.apply(this, arguments);
            this.attributes = { rows: {}, quantities: {} };
            var primaryComponent = this.components[0];
            this.islands = []; this.holes = [];

            var polygon = this;
            _.each(this.components, function(component)
            {
                if (component == primaryComponent || !primaryComponent.intersects(component))
                { polygon.islands.push(component); }
                else
                { polygon.holes.push(component); }
            });

            _.defer(function() { polygon.getBounds(); }); // Precache if it's faster.
        },

        containsPoint: function(point) {
            if (!this.getBounds().contains(point.x, point.y)) { return false; }

            var numIslands = this.islands.length;
            var numHoles = this.holes.length;
            var contained = false;
            if(numIslands > 0) {
                // check exterior ring - 1 means on edge, boolean otherwise
                for(var i=0; i<numIslands; ++i) {
                    contained = this.islands[i].containsPoint(point);
                    if (contained) break;
                }
                if(contained !== 1) {
                    if(contained && numHoles > 1) {
                        // check interior rings
                        var hole;
                        for(var i=1; i<numHoles; ++i) {
                            hole = this.holes[i].containsPoint(point);
                            if(hole) {
                                if(hole === 1) {
                                    // on edge
                                    contained = 1;
                                } else {
                                    // in hole
                                    contained = false;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            return contained;
        }
    });

    // Delaying this object from being created until after we're sure libraries
    // have been loaded. First action in renderData should turn this back into an
    // object.
    var MAP_TYPE = function(){ return {
        'canada_provinces': {
            'jsonCache': function(config) { return "/geodata/canada.admin1.json"; }
        },
        'countries': {
            'layerPath': "https://server.arcgisonline.com/ArcGIS/rest/services/" +
                         "World_Topo_Map/MapServer/6",
            'jsonCache': function(config) { return "/geodata/esri_country_data.json"; },
            'fieldsReturned': ["NAME"],
            'where': function (mapObj, config)
                { return "TYPE = 'Country'"; },
            'zoom' : 1
        },
        'state': {
            'layerPath': "https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/" +
                         "Demographics/ESRI_Census_USA/MapServer/5",
            'jsonCache': function(config) { return "/geodata/esri_state_data.json"; },
            'fieldsReturned': ["STATE_NAME", "STATE_ABBR"],
            'where': function (mapObj, config)
                { return "1=1" },
            'transformFeatures': {
                'Alaska': { 'scale': 0.6,
                    'offset': { 'x': 1950000, 'y': -4500000 } },
                'Hawaii': { 'scale': 1.2, 'offset': { 'x': 5000000, 'y': 800000 } }
                }
        },
        'counties': {
            'layerPath': "https://server.arcgisonline.com/ArcGIS/rest/services/" +
                         "Demographics/USA_Tapestry/MapServer/3",
            'jsonCache': function(config)
                { return "/geodata/esri_county_"+config.region.toLowerCase()+".json"; },
            'fieldsReturned': ["NAME", "ST_ABBREV"],
            'where': function (mapObj, config)
                { return "ST_ABBREV = '"+config.region.toUpperCase()+"'"; }
        }
    };};

    // Available configurations:
    // - type (required)
    // - region (required for type:counties)
    // - colors (required): hash of low and high
    // - hideLayers: automatically set when only layer is default
    // - hideZoomSlider
    // - ignoreTransforms: ignores default transformations in MAP_TYPE
    // - transformFeatures: custom transforms at view level
    $.Control.registerMixin('heatmap', {
        initializeMap: function()
        {
            this._super();
            if (_.isFunction(MAP_TYPE)) { MAP_TYPE = MAP_TYPE(); }

            this.$dom().siblings('.mapLayers').hide();

            setUpHeatmap(this);
        },

        getColumns: function()
        {
            if (!this._super.apply(this, arguments)) { return false; }

            var viewConfig = this._byView[this._primaryView.id];
            var config = this._displayFormat.heatmap;

            config.aggregateMethod = (_.isUndefined(viewConfig._quantityCol)
                || viewConfig._quantityCol.id == 'fake_quantity') ?
                'count' : 'sum';

            // Fools everything depending on quantityCol into recognizing it as a Count
            if (config.aggregateMethod == 'count')
            {
                viewConfig._quantityCol = { 'id': 'fake_quantity', 'name': 'Count',
                    renderType: blist.datatypes.number, format: {} };
            }

            this.$legend({ name: config.quantityName || viewConfig._quantityCol.name });

            return true;
        },

        renderData: function(rows)
        {
            var mapObj = this;

            if (_.isUndefined(mapObj._byView[mapObj._primaryView.id]._locCol) &&
                !mapObj._primaryView.isArcGISDataset())
            {
                mapObj.errorMessage = 'Required columns missing';
                return false;
            }

            // Queries only need to be run once.
            // renderData actions happening during a query can be ignored,
            // because processRows uses mapObj._rows for initial processing.
            if (mapObj._runningQuery) { return; }

            if (mapObj._featuresRendered)
            { processRows(mapObj, rows); }
            else
            { processFeatures(mapObj, function() { processRows(mapObj, rows); }); }
        },

        rowRemoved: function(row)
        {
            var feature = findFeatureWithPoint(mapObj, row);
            if ($.isBlank(feature)) { return; }
            var ind;
            _.any(feature.attributes.rows, function(r, i)
            {
                if (r.id == row.id)
                {
                    ind = i;
                    return true;
                }
                return false;
            });
            if ($.isBlank(ind)) { return; }

            feature.attributes.rows.splice(ind, 1);
            if (!_.isEmpty(feature.attributes.quantities))
            { feature.attributes.quantities.splice(ind, 1); }
        },

        generateFlyoutLayout: function(columns, noLabel, view)
        {
            var mapObj = this;
            var defLayout = mapObj._super(columns, noLabel, view);
            if ($.isBlank(defLayout)) { return null; }

            // Adjust title
            var titleRow = defLayout.columns[0].rows[0];
            titleRow.fields[0].type = 'label';
            delete titleRow.fields[0].tableColumnId;
            titleRow.fields[0].text = 'Fill in name';

            // Add quantity
            var quantityRow = {fields: [
                {type: 'label', text: 'Fill in quantity name'},
                {type: 'label', text: 'Fill in quantity',
                    styles: {'font-weight': 'normal'}}
            ], styles: $.extend({}, titleRow.styles, {'font-weight': null})};
            defLayout.columns[0].rows.splice(1, 0, quantityRow);

            // Adjust title styles
            _.each(['border-bottom', 'margin-bottom', 'padding-bottom'],
                function(s) { delete (titleRow.styles || {})[s]; });

            return defLayout;
        },

        getFlyout: function(rows, details)
        {
            var mapObj = this;
            var $flyout = mapObj._super(rows, details, mapObj._primaryView);
            if ($.isBlank($flyout)) { return null; }

            var viewConfig = mapObj._byView[mapObj._primaryView.id];

            $flyout.find('.richColumn').each(function()
            {
                var $col = $(this);
                // Fill in name
                $col.find('.richLine:first-child .staticLabel')
                    .text(details.name);

                // Fill in quantity
                var $quantLine = $col.find('.richLine:nth-child(2)');
                $quantLine.find('.staticLabel:first-child')
                    .text(mapObj._displayFormat.heatmap.quantityName || viewConfig._quantityCol.name);
                $quantLine.find('.staticLabel:last-child')
                    .html(viewConfig._quantityCol.renderType.renderer(details.quantity,
                            viewConfig._quantityCol));
            });

            return $flyout;
        },

        cleanVisualization: function()
        {
            var mapObj = this;
            mapObj._super();

            _.each((mapObj._featureSet || {}).features || [], function(feature)
            {
                delete feature.attributes.description;
                delete feature.attributes.quantities;
                delete feature.attributes.quantity;
                delete feature.attributes.redirect_to;
                delete feature.attributes.rows;
            });

            delete mapObj._featuresRendered;
            delete mapObj._segmentColors;
        },

        reloadVisualization: function()
        {
            this._super();
            setUpHeatmap(this);
        }
    }, null, 'socrataMap');


    var setUpHeatmap = function(mapObj)
    {
        var viewConfig = mapObj._byView[mapObj._primaryView.id];
        var config = mapObj._displayFormat.heatmap;

        if (config.type == 'custom')
        {
            MAP_TYPE['custom'] = {
                'jsonCache': function(config)
                { return '/geodata/' + config.cache_url; }
            };
        }
        else if (config.type == 'counties')
        {
            config.region = STATE_ABBREV[config.region.toLowerCase()] || config.region;
            if ($.isBlank(config.region)) { return; }
        }

        config.hideLayers = config.hideLayers || (config.type == 'state' && (
            !mapObj._displayFormat.layers
            || mapObj._displayFormat.layers.length == 0));
        if (mapObj._displayFormat.forceBasemap)
        {
            config.hideLayers = false;
            config.ignoreTransforms = true;
            mapObj.showLayers();
        }
        if (config.hideLayers && mapObj.hideLayers) { mapObj.hideLayers(); }

        // Currently just making sure a config update to region is caught.
        if (mapObj._origHeatmapConfig
            && (mapObj._origHeatmapConfig.type != config.type ||
                mapObj._origHeatmapConfig.region != config.region))
        { mapObj._featureSet = undefined; }
        mapObj._origHeatmapConfig = config;

        if ($.isBlank(mapObj._segmentColors))
        {
            mapObj._segmentColors = [];
            var lowColor  = config.colors && config.colors.low ?
                $.hexToRgb(config.colors.low)
                : { r: 209, g: 209, b: 209};
            var highColor = config.colors && config.colors.high ?
                $.hexToRgb(config.colors.high)
                : { r: 44, g: 119, b: 14};
            var colorStep = {
                r: Math.round((highColor.r-lowColor.r)/mapObj._numSegments),
                g: Math.round((highColor.g-lowColor.g)/mapObj._numSegments),
                b: Math.round((highColor.b-lowColor.b)/mapObj._numSegments)
            };

            for (var i = 0; i < mapObj._numSegments; i++)
            {
                mapObj._segmentColors[i] =
                    new dojo.Color([lowColor.r+(colorStep.r*i),
                                    lowColor.g+(colorStep.g*i),
                                    lowColor.b+(colorStep.b*i),
                                    config.hideLayers ? 1.0 : 0.8]);
            }

            mapObj.$legend({
                gradient: _.map(mapObj._segmentColors, function(color)
                    { return color.toCss(false); })
            });
        }

        if ($.isBlank(mapObj._featureSet)) { fetchFeatureSet(mapObj); }
    };

    var fetchFeatureSet = function(mapObj)
    {
        var config = mapObj._displayFormat.heatmap;

        mapObj.startLoading();
        if (MAP_TYPE[config.type].jsonCache)
        {
            // jQuery's AJAX methods aren't functioning and the clearest root cause
            // is that the JSON parser is running into a performance problem.
            // We're using Dojo here because ESRI does and its parser seems to
            // handle the demanded load fine.
            dojo.xhrGet({
                url: MAP_TYPE[config.type].jsonCache(config),
                handleAs: 'json',
                load: function(data, ioArgs) {
                    mapObj._featureSet = data;
                    reClassifyFeatures(mapObj);
                    processFeatures(mapObj,
                    function() { processRows(mapObj, mapObj._primaryView._activeRowSet._rows); });
                }
            });
        }
        else
        {
            dojo.require('esri.tasks.query');
            var query = new esri.tasks.Query();
            query.outFields = MAP_TYPE[config.type].fieldsReturned;
            query.returnGeometry = true;
            query.outSpatialReference = mapObj.map.spatialReference ||
                new esri.SpatialReference({ wkid: 102100 });

            query.where = MAP_TYPE[config.type].where(mapObj, config);
            new esri.tasks.QueryTask(MAP_TYPE[config.type].layerPath)
                .execute(query, function(featureSet)
                    {
                        mapObj._featureSet = featureSet;
                        processFeatures(mapObj,
                            function() { processRows(mapObj,
                                        mapObj._primaryView._activeRowSet._rows); });
                    });
        }
        mapObj._runningQuery = true;

        setTimeout(function()
        {
            // query took too long and probably timed out
            // so we're just going to kill the spinner and error it
            // if the query does finish, it will load behind the alert
            if (mapObj._runningQuery)
            {
                mapObj.finishLoading();
                alert('A data request has taken too long and timed out.');
            }
        }, 60000);
    };

    var processRows = function(mapObj, rows)
    {
        var viewConfig = mapObj._byView[mapObj._primaryView.id];
        var config = mapObj._displayFormat.heatmap;

        var decorateFeature = function(row, i)
        {
            var feature = findFeatureWithPoint(mapObj, row);
            if ($.isBlank(feature)) { return null; }
            feature.attributes.rows = feature.attributes.rows || [];
            var ind = feature.attributes.rows.length;
            _.any(feature.attributes.rows, function(r, i)
            {
                if (r.id == row.id)
                {
                    ind = i;
                    return true;
                }
                return false;
            });
            feature.attributes.rows[ind] = row;

            feature.attributes.quantities = $.makeArray(feature.attributes.quantities);

            // Maintain as strings for precision calcs later.
            if (config.aggregateMethod == 'sum' && !row.invalid[viewConfig._quantityCol.id])
            { feature.attributes.quantities[ind] = row[viewConfig._quantityCol.id]; }
            if (config.aggregateMethod == 'count')
            { feature.attributes.quantities[ind] = '1'; }

            var redirectTarget;
            if (viewConfig._redirectCol)
            {
                redirectTarget = viewConfig._redirectCol.dataTypeName == 'url'
                                ? row[viewConfig._redirectCol.id].url
                                : row[viewConfig._redirectCol.id];
            }

            // Last value used for simplicity.
            feature.attributes.redirect_to = redirectTarget ||
                feature.attributes.redirect_to;

            return feature;
        };

        // IE wannabe performance monitor: you make baby Ritchie cry
        var updatedFeatures = [];
        $.batchProcess(_.toArray(rows), 10, decorateFeature,
            function(batch)
            { updatedFeatures = updatedFeatures.concat(_.compact(batch)); },
            function()
            { afterRowDecoration(mapObj, _.uniq(updatedFeatures)); }
        );
    };

    var afterRowDecoration = function(mapObj, updatedFeatures)
    {
        var viewConfig = mapObj._byView[mapObj._primaryView.id];
        var config = mapObj._displayFormat.heatmap;

        // Converts array to value if array; otherwise, just returns value.
        var getValue = function(e)
        {
            if (_.isEmpty(e.attributes.quantities))
            { return null; }

            e.attributes.quantities = _.compact(e.attributes.quantities);

            // aggregateMethod count just sums up 1s.
            var quantityPrecision = 0;
            e.attributes.quantity = _.reduce(
                e.attributes.quantities, function(m, v)
                {
                    var precision = v.indexOf('.') > -1
                                    ? v.length-v.lastIndexOf('.')-1 : 0;
                    quantityPrecision = quantityPrecision > precision
                                    ? quantityPrecision : precision;
                    return m + parseFloat(v);
                }, 0.0).toFixed(quantityPrecision);

            return parseFloat(e.attributes.quantity);
        };

        var max = _.max(_.compact(_.map(mapObj._featureSet.features, getValue)));
        var min = _.min(_.compact(_.map(mapObj._featureSet.features, getValue)));
        mapObj.$legend({ minimum: min, maximum: max });
        var segments = [];
        for (i = 0; i < mapObj._numSegments; i++)
        { segments[i] = ((i+1)*(max-min)/mapObj._numSegments)+min; }

        _.each(updatedFeatures, function(feature)
        {
            var segmentIndex;
            for (segmentIndex = 0; segmentIndex < mapObj._numSegments; segmentIndex++)
            {
                if (parseFloat(feature.attributes.quantity) <= segments[segmentIndex])
                { break; }
            }

            var details = {
                flyoutDetails: {name: feature.attributes.NAME,
                    quantity: feature.attributes.quantity},
                rows: feature.attributes.rows,
                dataView: mapObj._primaryView,
                color: mapObj._segmentColors[segmentIndex].toHex(),
                redirect_to: feature.attributes.redirect_to
            };

            if (!feature.attributes.NAME)
            { feature.attributes.NAME = feature.attributes[mapObj._featureDisplayName]; }
            mapObj.renderGeometry('polygon', feature.geometry,
                feature.attributes.NAME, details);
        });
    };

    var processFeatures = function(mapObj, callback)
    {
        var config = mapObj._displayFormat.heatmap;

        mapObj._runningQuery = false;
        mapObj._featureDisplayName = mapObj._featureSet.displayFieldName;

        if (mapObj._featuresRendered) { callback(); return; }
        mapObj._featuresRendered = true;

        if (!mapObj._featuresTransformed)
        {
            transformFeatures(mapObj._featureSet.features, config);
            mapObj._featuresTransformed = true;
        }

        $.batchProcess(mapObj._featureSet.features, 10, function(feature)
        {
            if (!feature.attributes.NAME)
            { feature.attributes.NAME = feature.attributes[mapObj._featureDisplayName]; }
            if (mapObj._displayFormat.forceBasemap && feature.oldGeometry)
            {
                feature.geometry = feature.oldGeometry;
                delete feature.oldGeometry;
            }

            mapObj.renderGeometry('polygon', feature.geometry, feature.attributes.NAME,
                { dataView: mapObj._primaryView, rows: [], opacity: 0 });
        }, null, function()
        {
            mapObj.adjustBounds();

            if (config.hideLayers || config.transformFeatures ||
                (!config.ignoreTransforms &&
                    MAP_TYPE[config.type].transformFeatures))
            { if (mapObj.hideLayers) { mapObj.hideLayers(); } }

            var renderedRows = _.size(mapObj._primaryView._activeRowSet._rows);
            if (renderedRows >= mapObj._maxRows
                || renderedRows >= mapObj._primaryView.totalRows())
            { mapObj.mapElementLoaded(); }

            mapObj.finishLoading();
            callback();
        });
    };

    var findFeatureWithPoint = function(mapObj, datum)
    {
        var point;
        var viewConfig = mapObj._byView[mapObj._primaryView.id];

        if (!datum[viewConfig._locCol.id]) { return null; }
        if (viewConfig._locCol.renderTypeName == 'location')
        {
            if ($.isBlank(datum[viewConfig._locCol.id])) { return null; }

            var latVal  = datum[viewConfig._locCol.id].latitude;
            var longVal = datum[viewConfig._locCol.id].longitude;
            if (latVal && longVal)
            {
                point = new OpenLayers.Geometry.Point(longVal, latVal).transform(
                    blist.openLayers.geographicProjection, mapObj.map.getProjectionObject());
            }
            else
            {
                if (!datum[viewConfig._locCol.id].human_address) { return null; }
                // State is the only salient region to search for in a location
                // w/o lat/lng.  Well, there are ZIP codes, but we have no GIS
                // data for those yet.
                point = JSON.parse(datum[viewConfig._locCol.id].human_address);
                if (point) { point = point.state; }
                else { return null; }
            }
        }
        else if (viewConfig._locCol.renderTypeName == 'text')
        {
            point = datum[viewConfig._locCol.id];
            if (point.substr(0, 3) == 'US-')
            { point = point.substr(3, 2); }
        }

        return _.detect(mapObj._featureSet.features, function(feature)
        {
            if (point instanceof OpenLayers.Geometry.Point)
            {
                var polygon = (feature.oldGeometry || feature.geometry);
                return polygon.getBounds().contains(point.x, point.y)
                    && polygon.containsPoint(point);
            }
            else
            {
                var featureName = feature.attributes['NAME']
                                  || feature.attributes['STATE_NAME'];
                if (feature.attributes['STATE_ABBR'] && point.length == 2)
                { featureName = feature.attributes['STATE_ABBR']; }

                return point.toUpperCase() == featureName.toUpperCase();
            }
        });
    };

    var transformFeatures = function(features, config)
    {
        if (!config.transformFeatures &&
            (config.ignoreTransforms || !MAP_TYPE[config.type].transformFeatures))
        { return; }

        _.each(features, function(feature)
        {
            var key = feature.attributes['NAME'] || feature.attributes['STATE_NAME'];
            var transform;
            if (config.transformFeatures)
            { transform = config.transformFeatures[key]; }
            transform = transform ||
                MAP_TYPE[config.type].transformFeatures[key];

            if (!transform) { return; }

            feature.oldGeometry = feature.geometry.clone();
            var geometry = feature.geometry;
            var rings = geometry.components;
            var center = geometry.getBounds().getCenterLonLat();
            center = new OpenLayers.Geometry.Point(center.lon, center.lat);

            for (var r = 0; r < rings.length; r++)
            {
                if (transform.scale)
                { rings[r].resize(transform.scale, center); }
                if (transform.offset)
                { rings[r].move(transform.offset.x, transform.offset.y); }
            }
        });
    };

    var reClassifyFeatures = function(mapObj)
    {
        mapObj._featureSet.features = _.map(mapObj._featureSet.features,
            function(feature)
            {
                feature.geometry
                    = new blist.openLayers.Polygon(_.map(feature.geometry.rings, function(ring)
                    { return new OpenLayers.Geometry.LinearRing(_.map(ring, function(point)
                        { return new OpenLayers.Geometry.Point(point[0], point[1]); })); }));
                return feature;
            });
    };

})(jQuery);
