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
        name: 'Revert should reset datasets to the original set',
        dataset: 'viewpointsViewport',
        callUpdate: function() {
            this.evaluate(function() {
                blist.dataset.update({
                    displayFormat: {
                        "bkgdLayers":[{"opacity":1,"layerName":"World Street Map (ESRI)"}],
                        "viewport":{
                            "ymin":47.484740689471685,"ymax":47.72270861134587,
                            "xmin":-123.13211394161569,"xmax":-122.14334441055122},
                        "exclusiveLayers":false,
                        "viewDefinitions":[
                            {"uid":"27ys-67jn","plotStyle":"point","color":"#0000ff","flyoutsNoLabel":false,"plot":{"locationId":18443,"descriptionColumns":[{}]}},
                            {"uid":"s4r2-wuhk","plotStyle":"point","plot":{"locationId":20015,"descriptionColumns":[{}]},"color":"#00ff00","flyoutsNoLabel":false}
                        ]
                    }
                });
            });
        },
        runAsserts: function(testName)
        {
            this.test.assert(this.notTemporary(), bracket(testName) + 'Viz is not temporary');
            this.test.assert(this.evaluate(function() { return mapObj._children.length == 1; }),
                bracket(testName) + 'Only 1 child');
            this.test.assert(this.evaluate(function() { return mapObj._children[0]._view.id == '27ys-67jn'; }),
                bracket(testName) + 'Child is correct child.');
        }
    },
    {
        name: 'Revert on a saved viewport should reset the viewport to the original viewport',
        dataset: 'viewpointsViewport',
        callUpdate: function() {
            this.evaluate(function() { mapObj.map.zoomIn(); });
        },
        runAsserts: function(testName)
        {
            this.test.assert(this.notTemporary(), bracket(testName) + 'Viz is not temporary');
            this.test.assert(this.evaluate(function()
                {
                    var originalViewport = new OpenLayers.Bounds(-123.13211394161569, 47.72270861134587,
                                                                 -122.14334441055122, 47.484740689471685);
                    originalViewport.transform(blist.openLayers.geographicProjection,
                                               mapObj.map.getProjectionObject());
                    return !mapObj._viewportHandler.willMove(originalViewport);
                }),
                bracket(testName) + 'Original viewport is retained.');
        }
    },
    {
        name: 'Revert on a saved viewport should reset the viewport to the original viewport',
        dataset: 'legacyGoogle',
        callUpdate: function() {
            this.evalAndEcho(function() { return window.originalViewport.toArray().join(', '); });
        },
        runAsserts: function(testName)
        {
            this.test.assert(this.notTemporary(), bracket(testName) + 'Viz is not temporary');
            this.test.assert(this.evaluate(function()
                {
                    var originalViewport = mapObj._viewportHandler.preferredViewport();
                    return !mapObj._viewportHandler.willMove(originalViewport);
                }),
                bracket(testName) + 'Original viewport is retained.');
        }
    },
    {
        name: 'Revert should reset colors, sizes, and flyouts to original configuration',
        dataset: 'viewpointsViewport',
        formFill: function() {
            this.evaluate(function() { $('.colorControl:visible').trigger('color_change', '#ff0000'); });
        },
        runAsserts: function(testName)
        {
            this.test.assert(this.notTemporary(), bracket(testName) + 'Viz is not temporary');
            this.test.assert(this.evaluate(function()
                { return mapObj._children[0]._displayFormat.color; }) == '#0000ff',
                bracket(testName) + 'Color reset correctly');
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
casper.makePaneObj = function() {
    return this.evaluate(function() { window.paneObj = blist.datasetPage.sidebar._currentPane.control; }); };
casper.notTemporary = function() { return this.evaluate(function() { return blist.dataset.temporary === false; }); };
casper.callRevert = function() { this.evaluate(function() { blist.dataset.reload(); }); };

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
        this.screenshot(test.name + ' (before revert)');

        this.then(this.callRevert);
        this.waitFor(this.notTemporary, null, timeout('temporary'))
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
