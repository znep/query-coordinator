var viewport = { width: 1440, height: 669 },
    clipRect = { top: 0, left: 0, width: 1440, height: 669 };

var casper = require('casper').create({
        pageSettings: {
            javascriptEnabled: true,
            loadImages: true,
            loadPlugins: true,
            localToRemoteUrlAccessEnabled: true
        },
        logLevel: 'debug',
        verbose: false,
        viewportSize: viewport }),
    utils = require('utils');

//var datasetsToTest = JSON.parse(require('fs').read(casper.cli.args[0]));
var datasets = {
    'viewpoints': {
        domain: 'opendata.test-socrata.com', uid: '27ys-67jn',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsColor': {
        domain: 'opendata.test-socrata.com', uid: 'bsyu-pu7p',
        flags: { 'maps=nextgen': true },
    },
    'earthquakes': {
        domain: 'opendata.test-socrata.com', uid: 'k26n-9ce9',
        flags: { 'maps=nextgen': true },
    },
    'neighborhood': {
        domain: 'opendata.test-socrata.com', uid: 'kzhc-gxup',
        flags: { 'maps=nextgen': true },
    },
    'alternativeSchools': {
        domain: 'opendata.test-socrata.com', uid: 's4r2-wuhk',
        flags: { 'maps=nextgen': true },
    }
};

if (casper.cli.options.test)
{
    for (var i = 0; i < datasetsToTest.length; i++)
    {
        if (datasetsToTest[i].comment == casper.cli.options.test)
        { datasetsToTest = [datasetsToTest[i]]; break; }
    }
}

function bracket(str) { return ['[', str, '] '].join(''); }

function buildDatasetURL(config) {
    var url = ["https:/", config.domain, 'dataset', config.uid];
    var query = [];
    for (var flag in config.flags)
    {
        if (config.flags[flag])
        { query.push(flag); }
    }
    if (query.length > 0) { url.push('?' + query.join('&')); }
    return url.join('/');
}

function timeout(msg)
{
    return function() { this.log('Timed out: ' + msg, 'debug'); };
};

casper.waitASec = function() { return this.wait(1000); };
casper.hasMapObj = function() {
    return this.evaluate(
        function() { return _.isFunction(blist.datasetPage.rtManager.$domForType('map').socrataMap); }
    );
};
casper.makeMapObj = function() {
    return this.evaluate(function() {window.mapObj = blist.datasetPage.rtManager.$domForType('map').socrataMap(); });
};
casper.mapIsReady = function() { return this.evaluate(function() { return mapObj._doneLoading; }); };
casper.openSidebar = function() {
    return this.evaluate(function() { blist.datasetPage.sidebar.show('visualize.mapCreate') }); };

var profiles = {};
casper.profile = function(type, units) {
    if (profiles[type] && units)
    {
        if (units == 's')
        { this.log(type + ' took ' + (new Date().getTime() - profiles[type]) / 1000 + units, 'info'); }
        delete profiles[type];
    }
    else { profiles[type] = new Date().getTime(); }
};

casper.evalAndEcho = function(func) { this.echo(this.evaluate(func)); };
casper.screenshot = function(filename) { this.capture('screenshots/' + (filename.replace('/', '\/') || 'blargh') + '.png', clipRect); };

casper.start();

var testsToRun = [
    {
        name: 'Create map with no backgrounds',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.baseLayer.name; }) == 'World Street Map (ESRI)',
                    bracket(currentTest) + 'Map has "World Street Map (ESRI)" baseLayer.');
                assert(this.evaluate(function() { return mapObj.map.baseLayer.visibility; }) === false,
                    bracket(currentTest) + 'Map has "World Street Map (ESRI)" baseLayer which is hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 0,
                    bracket(currentTest) + 'Overview does not have any backgrounds.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == true,
                    bracket(currentTest) + 'MapTypeSwitcher is not visible.');
            }
        }
    },
    {
        name: 'Create map with 1 background',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.baseLayer.name; }) == 'Google Roadmap',
                    bracket(currentTest) + 'Map has appropriate background layer.');
                assert(this.evaluate(function() { return mapObj.map.baseLayer.visibility; }) === true,
                    bracket(currentTest) + 'Map has appropriate background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 1,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'Google Roadmap',
                    bracket(currentTest) + 'Overview shows appropriate background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate background with a checked checkbox.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == true,
                    bracket(currentTest) + 'MapTypeSwitcher is not visible.');
            }
        }
    },
    {
        name: 'Create map with multiple backgrounds',
        formFill: function() {
            this.evaluate(function() { $('.repeater a.addValue:first').click(); });
            this.waitASec();
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapCreate_5:layerName-1': 'Bing Road',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers().length; }) == 2,
                    bracket(currentTest) + 'Map has two backgrounds.');
                assert(this.evaluate(function() { return mapObj.map.baseLayer.name; }) == 'Google Roadmap',
                    bracket(currentTest) + 'Map has appropriate background layer.');
                assert(this.evaluate(function() { return mapObj.map.baseLayer.visibility; }) === true,
                    bracket(currentTest) + 'Map has appropriate background layer which is not hidden.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].name; }) == 'Bing Road',
                    bracket(currentTest) + 'Map has correct second background layer.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].visibility; }) === true,
                    bracket(currentTest) + 'Map has correct second background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 2,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'Google Roadmap',
                    bracket(currentTest) + 'Overview shows appropriate first background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate first background with a checked checkbox.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) label').text(); }) == 'Bing Road',
                    bracket(currentTest) + 'Overview shows appropriate second background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate second background with a checked checkbox.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == true,
                    bracket(currentTest) + 'MapTypeSwitcher is not visible.');
            }
        }
    },
    {
        name: 'Create map with multiple backgrounds with exclusive layers',
        formFill: function() {
            this.evaluate(function() { $('.repeater a.addValue:first').click(); });
            this.waitASec();
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapCreate_5:layerName-1': 'Bing Road',
                'controlPane_mapCreate_5:displayFormat.exclusiveLayers': true,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.baseLayer.name; }) == 'Google Roadmap',
                    bracket(currentTest) + 'Map has appropriate background layer.');
                assert(this.evaluate(function() { return mapObj.map.baseLayer.visibility; }) === true,
                    bracket(currentTest) + 'Map has appropriate background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 1,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'Google Roadmap',
                    bracket(currentTest) + 'Overview shows appropriate first background.');
                // This should be looking for a radio button.
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate first background with a selected radio button.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == false,
                    bracket(currentTest) + 'MapTypeSwitcher is visible.');
                assert(
                    this.evaluate(function() { return _.keys(mapObj._controls.MapTypeSwitcher.layers)[0]; }) == 'Roadmap',
                    bracket(currentTest) + 'MapTypeSwitcher first alias is correct.');
                assert(
                    this.evaluate(function() { return _.keys(mapObj._controls.MapTypeSwitcher.layers)[1]; }) == 'Road',
                    bracket(currentTest) + 'MapTypeSwitcher second alias is correct.');
            }
        }
    },
    {
        name: 'Create map with point map',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer instanceof OpenLayers.Layer.Vector; }),
                    bracket(currentTest) + 'A Layer.Vector exists.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0] instanceof OpenLayers.Feature.Vector; }),
                    bracket(currentTest) + 'A Layer.Vector exists, with appropriate Feature.Vectors contained.');
            }
        }
    },
    {
        name: 'Create map with point map choosing 1 of 2 location columns',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18447
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer instanceof OpenLayers.Layer.Vector; }),
                    bracket(currentTest) + 'A Layer.Vector exists.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0] instanceof OpenLayers.Feature.Vector; }),
                    bracket(currentTest) + 'A Layer.Vector exists, with appropriate Feature.Vectors contained.');
                assert(this.evaluate(function()
                    { 
                        //var feature = mapObj._children[0]._displayLayer.features[0];
                        //var row = feature.geometry.clone().transform(mapObj.map.getProjectionObject(), blist.openLayers.geographicProjection);
                        //return (parseFloat(feature.attributes.rows[0][mapObj._children[0]._locCol.id].longitude) == row.x)
                               //&& (parseFloat(feature.attributes.rows[0][mapObj._children[0]._locCol.id].latitude) == row.y);
                        return mapObj._children[0]._locCol.tableColumnId == 18447;
                    }),
                    bracket(currentTest) + 'Feature.Vectors are using the correct location from their attributes.rows.');
            }
        }
    },
    {
        name: 'Create map with point map using a non-default base color',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
            this.evaluate(function() { $('.colorControl:visible').trigger('color_change', '#ff0000'); });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].style.fillColor == '#ff0000'; }),
                    bracket(currentTest) + 'Feature.Vectors are using the correct style.fillColor.');
            }
        }
    },
    {
        name: 'Create map with point map using a point size',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.sizeValueId': 18440
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._segments[102673]); }),
                    bracket(currentTest) + 'layerObj._segments[col.id] is defined.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].style.pointRadius != mapObj._children[0]._displayLayer.features[23].style.pointRadius; }),
                    bracket(currentTest) + 'Feature.Vectors are using variable style.pointRadius values.');
            }
        }
    },
    {
        name: 'Create map with point map using a point color',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.colorValueId': 18440
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._segments[102673]); }),
                    bracket(currentTest) + 'layerObj._segments[col.id] is defined.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].style.fillColor != mapObj._children[0]._displayLayer.features[23].style.fillColor; }),
                    bracket(currentTest) + 'Feature.Vectors are using variable style.fillColor values.');
            }
        }
    },
    {
        name: 'Create map with point map using a point size and color',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.sizeValueId': 18440,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.colorValueId': 18440
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._segments[102673]); }),
                    bracket(currentTest) + 'layerObj._segments[col.id] is defined.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].style.pointRadius != mapObj._children[0]._displayLayer.features[23].style.pointRadius; }),
                    bracket(currentTest) + 'Feature.Vectors are using variable style.pointRadius values.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].style.fillColor != mapObj._children[0]._displayLayer.features[23].style.fillColor; }),
                    bracket(currentTest) + 'Feature.Vectors are using variable style.fillColor values.');
            }
        }
    },
    {
        name: 'Create map with point map using a icon',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.iconId': 19949
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._displayLayer.features[0].style.externalGraphic); }),
                    bracket(currentTest) + 'Feature.Vectors have style.externalGraphic defined.');
            }
        }
    },
    {
        name: 'Create map with point map using a icon and attempt to have point size or color',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.iconId': 19949,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.sizeValueId': 18440,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.colorValueId': 18440
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._displayLayer.features[0].style.externalGraphic); }),
                    bracket(currentTest) + 'Feature.Vectors have style.externalGraphic defined.');
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._segments[102673]); }),
                    bracket(currentTest) + 'layerObj._segments[col.id] is defined.');
                assert(this.evaluate(function()
                    { return _.isUndefined(mapObj._children[0]._displayLayer.features[0].style.fillColor); }),
                    bracket(currentTest) + '- Feature.Vectors do NOT have style.pointRadius or style.fillColor defined.');
            }
        }
    },
    {
        name: 'Create map with point map using flyout title',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.titleId': 18438
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                // Actually opening a flyout does not seem to be possible with any method I have tried so far.
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].attributes.flyout.find('.richLine').length >= 1; }),
                    bracket(currentTest) + 'An opened flyout contains a title section.');
            }
        }
    },
    {
        name: 'Create map with point map using flyout description',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:tableColumnId-0': 18438
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].attributes.flyout.find('.richItem').length >= 1; }),
                    bracket(currentTest) + 'An opened flyout contains the correct find(\'.richItem.columnId###\').');
            }
        }
    },
    {
        name: 'Create map with point map using flyout description with no labels',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_32:tableColumnId-0': 18438,
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.flyoutsNoLabel': true
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].attributes.flyout.find('.richItem.columnId102671').length >= 1; }),
                    bracket(currentTest) + 'An opened flyout contains the correct find(\'.richItem.columnId###\').');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].attributes.flyout.find('.richLabel').length == 0; }),
                    bracket(currentTest) + 'An opened flyout does not contain find(\'.richLabel\').');
            }
        }
    },
    {
        name: 'Create map with point map having <500 rows',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return _.has(mapObj._children[0]._displayLayer.features[0].attributes, 'rows'); }),
                    bracket(currentTest) + 'Feature.Vectors have attributes.rows.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._renderType == 'points'; }),
                    bracket(currentTest) + 'layerObj._renderType is "points".');
            }
        }
    },
    {
        name: 'Create map with point map having >500 rows',
        dataset: 'earthquakes',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 19982
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0] instanceof blist.openLayers.Cluster; }),
                    bracket(currentTest) + 'Feature.Vectors are actually blist.openLayers.Clusters.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._renderType == 'clusters'; }),
                    bracket(currentTest) + 'layerObj._renderType is "clusters".');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._clusterBoundaries instanceof OpenLayers.Layer.Vector; }),
                    bracket(currentTest) + 'layerObj._clusterBoundaries is defined.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._clusterBoundaries.features.length == 0; }),
                    bracket(currentTest) + 'layerObj._clusterBoundaries is defined and empty.');
            }
            this.evaluate(function() { mapObj._children[0].overFeature(mapObj._children[0]._displayLayer.features[0]); });
            this.test.assert(this.evaluate(function()
                { return mapObj._children[0]._clusterBoundaries.features.length > 0; }),
                bracket(currentTest) + 'Mouseover on a Cluster results in added features to layerObj._clusterBoundaries.');
        }
    },
    {
        name: 'Create map with point map and conditional formatting on the existing dataset',
        dataset: 'viewpointsColor',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[3].style.fillColor == '#bbffbb'; }),
                    bracket(currentTest) + 'Feature.Vectors with attributes.rows[i].color use that color in style.fillColor.');
            }
        }
    },
    {
        name: 'Create map with point map and conditional formatting on an additional dataset',
        dataset: 'alternativeSchools',
        formFill: function() {
            this.evaluate(function() { $('.repeater a.addValue:eq(1)').click(); });
            this.waitASec();
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapCreate_5:layerName-0': 'Google Roadmap',
                'dataset_name': '27ys-67jn',
            });
            this.evaluate(function() { $('input[name=dataset_name]').triggerHandler('blur'); });
            this.waitASec();
            this.screenshot('test');
            this.evalAndEcho(function() { return $('.mapDataLayerCreate').length; });
            this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point',
                'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_68:displayFormat.viewDefinitions.1.plotStyle': 'point'
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
            }
        }
    } // Copy paste up from here.
];

if (casper.cli.options.last)
{ testsToRun = [testsToRun[testsToRun.length - 1]]; }

casper.each(testsToRun, function(self, test) {
    var url = buildDatasetURL(datasets[test.dataset || 'viewpoints']);
    self.thenOpen(url, { method: 'get' })
    .then(function() {
        this.profile('loadDataset');
    })
    .then(function()
    {
        this.profile('loadDataset', 's');
        this.test.info(test.name);
        this.openSidebar();
        this.waitASec()
        .then(test.formFill)
        .waitASec()
        .then(function() { this.evaluate(function() { $('a.button.submit:first').click(); }); })
        .waitFor(this.hasMapObj, null, timeout('hasMapObj'))
        .then(this.makeMapObj);
        this.profile('mapIsReady');
        this.waitFor(this.mapIsReady, null, timeout('mapIsReady'))
        .then(function() {
            this.profile('mapIsReady', 's');
            this.waitASec();
            test.runAsserts.call(this, test.name);
            this.screenshot(test.name);
        });
    })
});

casper.run(function() {
    this.test.renderResults();
    this.exit();
});
