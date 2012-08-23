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
        name: 'Change basemap using MapTypeSwitcher',
        dataset: 'viewpointsExclLayers',
        runAsserts: function(currentTest) {

            this.evaluate(function() { $(mapObj.map.div).siblings('.mapTypes').find('a:last').click(); });

            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj.map.baseLayer instanceof OpenLayers.Layer.Bing; }),
                    bracket(currentTest) + 'Base Layer was successfully changed.');
                assert(this.evaluate(function()
                    { return blist.dataset.temporary === false; }),
                    bracket(currentTest) + 'Is not marked temporary.');
            }
        }
    },
    {
        name: 'Change basemap using Overview radio buttons',
        dataset: 'viewpointsExclLayers',
        runAsserts: function(currentTest) {

            this.evaluate(function() {
                $(mapObj.map.div).siblings('.mapLayers').find('.toggleLayers').click();
                $(mapObj.map.div).siblings('.mapLayers').find('input[type=radio]:last').click();
            });

            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj.map.baseLayer instanceof OpenLayers.Layer.Bing; }),
                    bracket(currentTest) + 'Base Layer was successfully changed.');
                assert(this.evaluate(function()
                    { return blist.dataset.temporary === false; }),
                    bracket(currentTest) + 'Is not marked temporary.');
            }
        }
    },
    {
        name: 'Change layer visibility',
        dataset: 'viewpointsExtraBkg',
        runAsserts: function(currentTest) {

            this.evaluate(function() {
                $(mapObj.map.div).siblings('.mapLayers').find('.toggleLayers').click();
                $(mapObj.map.div).siblings('.mapLayers').find(':checkbox:last').triggerHandler();
            });
            this.waitASec();

            with(this.test)
            {
                assert(this.evaluate(function()
                    { return mapObj._children[0]._displayLayer.visibility === false; }),
                    bracket(currentTest) + 'layerObj._displayLayer is hidden.');
            }
        }
    },
    {
        name: 'Zooming the map should mark temporary',
        dataset: 'viewpointsViewport',
        runAsserts: function(currentTest) {

            this.evaluate(function() { mapObj.map.zoomIn(); });
            this.waitASec();

            with(this.test)
            {
                assert(this.evaluate(function()
                    { return blist.dataset.temporary === true; }),
                    bracket(currentTest) + 'Dataset is marked temporary.');
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

