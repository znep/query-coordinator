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
    'esriDataset': {
        domain: 'opendata.test-socrata.com', uid: 'ykmd-gj5x',
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
casper.makePaneObj = function() {
    return this.evaluate(function() { window.paneObj = blist.datasetPage.sidebar._currentPane.control; }); };

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

var url = buildDatasetURL(datasets['viewpoints']);
casper.thenOpen(url, { method: 'get' })
.then(function() {
    this.profile('loadDataset');
})
.then(function() {
    var testName = 'Sidebar functionality';
    this.profile('loadDataset', 's');
    this.openSidebar();
    this.makePaneObj();
    this.then(function() {
        this.test.assert(this.evaluate(function()
            { return paneObj.$dom().find('select:eq(0)').val(); }) == 'World Street Map (ESRI)',
            bracket(testName) + 'The first background should default to World Street Map (ESRI).');
        this.test.assert(this.evaluate(function()
            { return paneObj.$dom().find('input.inputItem:visible:first').val(); }) == '100',
            bracket(testName) + 'The first background should default to opacity of 1.');

        this.test.assert(this.evaluate(function()
            { return paneObj.$dom().find('.line.custom div.inputItem').data('uid') == blist.dataset.id; }),
            bracket(testName) + 'Sidebar should default the first dataset to be current dataset.');
        this.evaluate(function() { paneObj.$dom().find('.repeater:eq(1) .addValue').click(); });
        this.test.assert(this.evaluate(function()
            { return paneObj.$dom().find('.line.custom:last div.inputItem').data('uid') == ''; }),
            bracket(testName) + 'Sidebar should default non-first datasets to be blank.');

        this.evaluate(function() { window.$subPaneObj = paneObj.childPanes[0].$dom(); });
        // Point Map
        this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
            'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'point'
        });

        var labelMap = ['Plot Style', 'Location', 'Base Color', '',
            'Point Size', 'Point Color', 'Icon', '', 'Title', 'Flyout Details', 'w/o Labels?'];
        for (var i = 0; i < labelMap.length; i++)
        { this.test.assert(this.evaluate(function(index)
            { return $subPaneObj.find('.sectionContent > .line:visible:eq(' + index + ')').find('label').text(); },
            { index: i }) == labelMap[i],
            bracket(testName) + 'Point Map Config: ' + labelMap[i]); }

        // Boundary Map 
        this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
            'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'heatmap'
        });

        var labelMap = ['Plot Style', 'Location', 'Region', '',
            'Color (Low)', 'Color (High)', 'Quantity', '', 'Title', 'Flyout Details', 'w/o Labels?'];
        for (var i = 0; i < labelMap.length; i++)
        { this.test.assert(this.evaluate(function(index)
            { return $subPaneObj.find('.sectionContent > .line:visible:eq(' + index + ')').find('label').text(); },
            { index: i }) == labelMap[i],
            bracket(testName) + 'Boundary Map Config: ' + labelMap[i]); }

        // Heat Map 
        this.fill('div#controlPane_mapCreate_5 > form.commonForm', {
            'controlPane_mapDataLayerCreate_32:displayFormat.viewDefinitions.0.plotStyle': 'rastermap'
        });

        var labelMap = ['Plot Style', 'Location', 'Quantity'];
        for (var i = 0; i < labelMap.length; i++)
        { this.test.assert(this.evaluate(function(index)
            { return $subPaneObj.find('.sectionContent > .line:visible:eq(' + index + ')').find('label').text(); },
            { index: i }) == labelMap[i],
            bracket(testName) + 'Heat Map Config: ' + labelMap[i]); }
    });
});

var url = buildDatasetURL(datasets['esriDataset']);
casper.thenOpen(url, { method: 'get' })
.then(function() {
    this.profile('loadDataset');
})
.then(function()
{
    var testName = 'Sidebar functionality';
    this.profile('loadDataset', 's');
    this.openSidebar();
    this.makePaneObj();
    this.then(function() {
        this.evaluate(function() { window.$subPaneObj = paneObj.childPanes[0].$dom(); });

        var labelMap = ['Title', 'Flyout Details', 'w/o Labels?'];
        for (var i = 0; i < labelMap.length; i++)
        { this.test.assert(this.evaluate(function(index)
            { return $subPaneObj.find('.sectionContent > .line:visible:eq(' + index + ')').find('label').text(); },
            { index: i }) == labelMap[i],
            bracket(testName) + 'Esri Dataset Config: ' + labelMap[i]); }
    });
});

casper.run(function() {
    this.test.renderResults();
    this.exit();
});

