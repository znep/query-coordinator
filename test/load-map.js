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

var datasets = {
    'esriDataset': {
        domain: 'opendata.test-socrata.com', uid: 'ykmd-gj5x',
        flags: { 'maps=nextgen': true },
    },
    'esriDatasetComposite': {
        domain: 'opendata.test-socrata.com', uid: 'brfq-4r44',
        flags: { 'maps=nextgen': true },
    },
    'viewpoints': {
        domain: 'opendata.test-socrata.com', uid: '27ys-67jn',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsViewport': {
        domain: 'opendata.test-socrata.com', uid: 't4qb-cp29',
        flags: { 'maps=nextgen': true },
    },
    'viewpointsGeolocation': {
        domain: 'opendata.test-socrata.com', uid: 'aqby-nytu',
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

var testsToRun = [
    {
        name: 'Load an ESRI map',
        dataset: 'esriDataset',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return mapObj._children[0]._displayLayer instanceof blist.openLayers.ExternalESRILayer; }),
                bracket(testName) + 'displayLayer is an ExternalESRILayer');
            this.test.assert(this.evaluate(function()
                { return mapObj._children[0]._displayLayer.name == 'Peak Hour No Parking'; }),
                bracket(testName) + 'displayLayer has a name');
            this.test.assert(this.evaluate(function()
                { return !_.isUndefined(mapObj._children[0]._displayLayer.getInitialExtent()); }),
                bracket(testName) + 'displayLayer has an initial extent');
        }
    },
    {
        name: 'Load an ESRI map with composite members',
        dataset: 'esriDatasetComposite',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return mapObj._children.length == 2; }),
                bracket(testName) + 'there are two layers');
            this.test.assert(this.evaluate(function()
                { return mapObj._children[1]._displayFormat.plotStyle == 'point'; }),
                bracket(testName) + 'composite member is a point map');
        }
    },
    {
        name: 'Loading a map should not mark temporary',
        dataset: 'viewpoints',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return blist.dataset.temporary === false; }),
                bracket(testName) + 'blist.dataset.temporary should be false.');
        }
    },
    {
        name: 'Loading a map with a saved viewport should not mark temporary',
        dataset: 'viewpointsViewport',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return blist.dataset.temporary === false; }),
                bracket(testName) + 'blist.dataset.temporary should be false.');
        }
    },
    {
        name: 'Loading a map with a saved geolocate should not mark temporary',
        dataset: 'viewpointsGeolocation',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return blist.dataset.temporary === false; }),
                bracket(testName) + 'blist.dataset.temporary should be false.');
        }
    },
    {
        name: 'Loading a map without a saved viewport should zoom to the data extent',
        dataset: 'legacyGoogle',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return mapObj._viewportHandler.willMove(mapObj._viewportHandler.preferredExtent()); }),
                bracket(testName) + 'mapObj.map.getExtent() should == mapObj.viewportHandler().preferredExtent().');
        }
    },
    {
        name: 'Loading map should zoom to a saved viewport',
        dataset: 'viewpointsViewport',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return mapObj._viewportHandler.willMove(mapObj._viewportHandler.preferredExtent()); }),
                bracket(testName) + 'mapObj.map.getExtent() should == mapObj._displayFormat.viewport.');
        }
    },
    {
        name: 'Loading map should zoom to a saved geolocate',
        dataset: 'viewpointsGeolocation',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return mapObj.map.getCenterLonLat().equals(mapObj._controls.GeocodeDialog._feature.geometry.toLonLat()); }),
                bracket(testName) + 'mapObj.map.getCenter() should == mapObj._controls.GeocodeDialog._feature.geometry.');
        }
    },
    {
        name: 'Loading a map should not result in any flyouts open',
        dataset: 'legacyGoogle',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return _.isUndefined(mapObj._popup); }),
                bracket(testName) + 'mapObj._popup is undefined.');
        }
    },
    {
        name: 'There should not be a spinner after the map is done loading',
        dataset: 'legacyGoogle',
        runAsserts: function(testName)
        {
            this.test.assert(this.evaluate(function()
                { return $("#renderTypeContainer > .loadingSpinnerContainer").length == 1; }),
                bracket(testName) + 'spinner exists');
            this.test.assert(this.evaluate(function()
                { return $("#renderTypeContainer > .loadingSpinnerContainer").filter(':visible').length == 0; }),
                bracket(testName) + 'spinner is not visible');
        }
    } // Copy paste up from here.
];

if (casper.cli.options.test)
{
    for (var i = 0; i < datasetsToTest.length; i++)
    {
        if (datasetsToTest[i].comment == casper.cli.options.test)
        { datasetsToTest = [datasetsToTest[i]]; break; }
    }
}

if (casper.cli.options.last)
{ testsToRun = [testsToRun[testsToRun.length - 1]]; }

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

casper.each(testsToRun, function(self, test)
{
    var url = buildDatasetURL(datasets[test.dataset]);
    self.thenOpen(url, { method: 'get' })
    .then(function() { this.profile('mapIsReady'); })
    .waitFor(self.mapIsReady, null, timeout('mapIsReady'))
    .then(function()
    {
        this.profile('mapIsReady', 's');
        this.makeMapObj();

        this.test.info(test.name);
        test.runAsserts.call(this, test.name);
        this.screenshot(test.name);
    });
});

casper.run(function() {
    this.test.renderResults();
    this.exit();
});
