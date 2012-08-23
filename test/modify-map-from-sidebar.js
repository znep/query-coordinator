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
    'viewpointsViewport': {
        domain: 'opendata.test-socrata.com', uid: 't4qb-cp29',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsExtraBkg': {
        domain: 'opendata.test-socrata.com', uid: 'n8p9-sisp',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsExclLayers': {
        domain: 'opendata.test-socrata.com', uid: 'yvt2-68ff',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsTwoDatasets': {
        domain: 'opendata.test-socrata.com', uid: '6358-nbfq',
        flags: { 'maps=nextgen': true },
    },
    'esriDataset': {
        domain: 'opendata.test-socrata.com', uid: 'ykmd-gj5x',
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
    },
    'washingtonCities': {
        domain: 'opendata.test-socrata.com', uid: '7g3h-sxfk',
        flags: { 'maps=nextgen': true },
    },
    'legacyGoogle': {
        domain: 'opendata.test-socrata.com', uid: '3t35-2n9v',
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
casper.screenshot = function(filename) { this.capture('screenshots/' + (filename || 'blargh') + '.png', clipRect); };

casper.start();

var testsToRun = [
    {
        name: 'Add a background layer',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.evaluate(function() { $('.repeater a.addValue:first').click(); });
            this.waitASec();
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapCreate_1:layerName-1': 'Bing Road'
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers().length; }) == 2,
                    bracket(currentTest) + 'Map has two backgrounds.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].name; }) == 'Bing Road',
                    bracket(currentTest) + 'Map has correct second background layer.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].visibility; }) === true,
                    bracket(currentTest) + 'Map has correct second background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 2,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'World Street Map (ESRI)',
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
        name: 'Remove a background layer',
        dataset: 'viewpointsExtraBkg',
        formFill: function() {
            this.evaluate(function() { $('.repeater a.removeLink:eq(1)').click(); });
            this.waitASec();
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers().length; }) == 1,
                    bracket(currentTest) + 'Map has two backgrounds.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 1,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'World Street Map (ESRI)',
                    bracket(currentTest) + 'Overview shows appropriate first background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate first background with a checked checkbox.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == true,
                    bracket(currentTest) + 'MapTypeSwitcher is not visible.');
            }
        }
    },
    {
        name: 'Toggle exclusive layers to true',
        dataset: 'viewpointsExtraBkg',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapCreate_1:displayFormat.exclusiveLayers': true
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers().length; }) == 2,
                    bracket(currentTest) + 'Map has two backgrounds.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].name; }) == 'Bing Road',
                    bracket(currentTest) + 'Map has correct second background layer.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].visibility; }) === true,
                    bracket(currentTest) + 'Map has correct second background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 2,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'World Street Map (ESRI)',
                    bracket(currentTest) + 'Overview shows appropriate first background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=radio]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate first background with a selected radio.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) label').text(); }) == 'Bing Road',
                    bracket(currentTest) + 'Overview shows appropriate second background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) input[type=radio]').attr('checked'); }) != 'checked',
                    bracket(currentTest) + 'Overview shows appropriate second background with an unselected radio.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) === false,
                    bracket(currentTest) + 'MapTypeSwitcher is visible.');
            }
        }
    },
    {
        name: 'Toggle exclusive layers to false',
        dataset: 'viewpointsExclLayers',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapCreate_1:displayFormat.exclusiveLayers': false
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers().length; }) == 2,
                    bracket(currentTest) + 'Map has two backgrounds.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].name; }) == 'Bing Road',
                    bracket(currentTest) + 'Map has correct second background layer.');
                assert(this.evaluate(function() { return mapObj.map.backgroundLayers()[1].visibility; }) === true,
                    bracket(currentTest) + 'Map has correct second background layer which is not hidden.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base').children().length; }) == 2,
                    bracket(currentTest) + 'Overview shows correct number of background layers.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) label').text(); }) == 'World Street Map (ESRI)',
                    bracket(currentTest) + 'Overview shows appropriate first background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(0) input[type=checkbox]').attr('checked'); }) == 'checked',
                    bracket(currentTest) + 'Overview shows appropriate first background with a checked checkbox');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) label').text(); }) == 'Bing Road',
                    bracket(currentTest) + 'Overview shows appropriate second background.');
                assert(this.evaluate(function()
                    { return $(mapObj.map.div).siblings('.mapLayers').find('ul.base li:eq(1) input[type=checkbox]').attr('checked'); }) != 'checked',
                    bracket(currentTest) + 'Overview shows appropriate second background with a checked checkbox.');
                assert(
                    this.evaluate(function() { return _.isEmpty(mapObj._controls.MapTypeSwitcher.layers); }) == true,
                    bracket(currentTest) + 'MapTypeSwitcher is visible.');
            }
        }
    },
    {
        name: 'Add a Socrata or ESRI dataset',
        dataset: 'viewpointsViewport',
        callUpdate: function() {
            this.evaluate(function()
            {
                blist.dataset.update({ displayFormat: {
                    "bkgdLayers":[{"opacity":1,"layerName":"World Street Map (ESRI)"}],
                    "viewport":{"ymin":47.484740689471685,"ymax":47.72270861134587,"xmin":-123.13211394161569,"xmax":-122.14334441055122},
                    "exclusiveLayers":false,
                    "viewDefinitions":[
                        {"uid":"27ys-67jn","plotStyle":"point","color":"#0000ff","flyoutsNoLabel":false,"plot":{"descriptionColumns":[{}],"locationId":18443}},
                        {"uid":"s4r2-wuhk","plotStyle":"point","color":"#00ff00","flyoutsNoLabel":false,"plot":{"descriptionColumns":[{}],"locationId":20015}}
                    ]}
                });
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 2; }),
                    bracket(currentTest) + 'mapObj._children should have one more element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayFormat.uid == '27ys-67jn'; }),
                    bracket(currentTest) + 'mapObj._children[0] has correct uid.');
                assert(this.evaluate(function()
                    { return mapObj._children[1]._displayFormat.uid == 's4r2-wuhk'; }),
                    bracket(currentTest) + 'mapObj._children[1] has correct uid.');
                assert(this.evaluate(function()
                    { return mapObj._controls.Overview._dataLayers.length == 2; }),
                    bracket(currentTest) + 'Overview has both data layers.');
                assert(this.evaluate(function()
                    { return mapObj._controls.Overview._dataLayers[0] == mapObj._children[0]; }),
                    bracket(currentTest) + 'Overview data layer 1 is children[0].');
                assert(this.evaluate(function()
                    { return mapObj._controls.Overview._dataLayers[1] == mapObj._children[1]; }),
                    bracket(currentTest) + 'Overview data layer 2 is children[1].');
            }
        }
    },
    {
        name: 'Remove a Socrata or ESRI dataset',
        dataset: 'viewpointsTwoDatasets',
        formFill: function() {
            this.evaluate(function() { $(".repeater:eq(1) a.removeLink").click(); });
            this.waitASec();
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 1; }),
                    bracket(currentTest) + 'mapObj._children should have one element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayFormat.uid == '27ys-67jn'; }),
                    bracket(currentTest) + 'mapObj._children[0] has correct uid.');
                assert(this.evaluate(function()
                    { return mapObj._controls.Overview._dataLayers.length == 1; }),
                    bracket(currentTest) + 'Overview has both data layers.');
                assert(this.evaluate(function()
                    { return mapObj._controls.Overview._dataLayers[0] == mapObj._children[0]; }),
                    bracket(currentTest) + 'Overview data layer 1 is children[0].');
            }
        }
    },
    {
        name: 'Change a dataset from Socrata to ESRI',
        dataset: 'viewpointsViewport',
        callUpdate: function() {
            this.evaluate(function()
            {   blist.dataset.update({
                    displayFormat: {
                        "bkgdLayers":[{"opacity":1,"layerName":"World Street Map (ESRI)"}],
                        "exclusiveLayers":false,
                        "viewDefinitions":[ {"uid":"ykmd-gj5x",} ]
                    }
                });
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 1; }),
                    bracket(currentTest) + 'mapObj._children should have one element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer instanceof blist.openLayers.ExternalESRILayer; }),
                    bracket(currentTest) + 'displayLayer is an ExternalESRILayer.');
            }
        }
    },
    {
        name: 'Change a dataset from ESRI to Socrata',
        dataset: 'esriDataset',
        callUpdate: function() {
            this.evaluate(function()
            {   blist.dataset.update({
                    displayFormat: {
                        "bkgdLayers":[{"opacity":1,"layerName":"World Street Map (ESRI)"}],
                        "exclusiveLayers":false,
                        "viewDefinitions":[ {"uid":"27ys-67jn","plotStyle":"point","color":"#0000ff","flyoutsNoLabel":false,"plot":{"descriptionColumns":[{}],"locationId":18443}} ]
                    }
                });
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 1; }),
                    bracket(currentTest) + 'mapObj._children should have one element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._view.id == '27ys-67jn'; }),
                    bracket(currentTest) + 'mapObj._displayFormat.viewDefinitions[i].uid should change to reflect correctly.');
                assert(this.evaluate(function()
                    { return !_.isUndefined(mapObj._children[0]._locCol); }),
                    bracket(currentTest) + 'mapObj._displayFormat.viewDefinitions[i].plot should have a locationId.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer instanceof OpenLayers.Layer.Vector; }),
                    bracket(currentTest) + 'displayLayer is an OpenLayers.Layer.Vector.');
            }
        }
    },
    {
        name: 'Change a Socrata DS plot style from Point to Boundary',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapCreate_1:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plotStyle': 'heatmap',
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plot.locationId': 18443,
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.heatmap.type': 'counties',
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.heatmap.region': 'wa'
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 1; }),
                    bracket(currentTest) + 'mapObj._children should have one element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.features[0].geometry instanceof OpenLayers.Geometry.Polygon; }),
                    bracket(currentTest) + 'Feature.Vectors have a .geometry of Polygon type.');
                assert(this.evaluate(function() { return !_.isUndefined(mapObj._children[0]._range); }),
                    bracket(currentTest) + 'layerObj._range is defined.');
                assert(this.evaluate(function() { return mapObj._children[0]._displayFormat.plotStyle == 'heatmap'; }),
                    bracket(currentTest) + 'layerObj._plotStyle is heatmap.');
            }
        }
    },
    {
        name: 'Change a Socrata DS plot style from Point to Heat',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapCreate_1:layerName-0': 'Google Roadmap',
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plotStyle': 'rastermap',
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plot.locationId': 18443
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children.length == 1; }),
                    bracket(currentTest) + 'mapObj._children should have one element.');
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer instanceof OpenLayers.Layer.Heatmap; }),
                    bracket(currentTest) + 'layerObj._displayLayer is OpenLayers.Layer.Heatmap.');
                assert(this.evaluate(function()
                    { return !_.isEmpty(mapObj._children[0]._dataStore); }),
                    bracket(currentTest) + 'layerObj._dataStore is not empty.');
            }
        }
    },
    {
        name: 'Change base color',
        dataset: 'viewpointsViewport',
        formFill: function() {
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
        name: 'Change point size or color or icon',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plot.sizeValueId': 18440
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
        name: 'Change location',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.fill('div#controlPane_mapCreate_1 > form.commonForm', {
                'controlPane_mapDataLayerCreate_27:displayFormat.viewDefinitions.0.plot.locationId': 18447
            });
        },
        runAsserts: function(currentTest) {
            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._locCol.tableColumnId == 18447; }),
                    bracket(currentTest) + 'Feature.Vectors are using the correct location from their attributes.rows.');
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

        if (test.formFill)
        {
            this.waitASec()
            .then(test.formFill)
            .waitASec()
            .then(function() { this.evaluate(function() { $('a.button.submit:first').click(); }); })
        }
        else if (test.callUpdate)
        {
            this.waitASec()
            .then(test.callUpdate)
            .waitASec()
        }

        this.waitFor(this.hasMapObj, null, timeout('hasMapObj'))
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

