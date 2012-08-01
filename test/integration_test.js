var casper = require('casper').create(),
    utils = require('utils');

var datasetsToTest = JSON.parse(require('fs').read(casper.cli.args[0]));

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

casper.start()

casper.thenOpen(['https:/', 'opendata.test-socrata.com', 'version'].join('/'), function() {
    var curRevision = this.fetchText({ type: 'xpath', path: '//dl[@class="versionInfo"]//dd[1]' });
    var lastDeploy = this.fetchText({ type: 'xpath', path: '//dl[@class="versionInfo"]//dd[2]' });
    this.echo("Current revision: " + curRevision + ' (' + lastDeploy + ')');
});

casper.each(datasetsToTest, function(self, test) {
    var url = buildDatasetURL(test), profiler;
    self.thenOpen(url, { method: 'get' })
    .then(function() {
        self.test.info(test.comment + '; Accessing: ' + url);
        profiler = new Date().getTime();
        //this.evaluate(function() { mapDebugger(); });
        this.evaluate(function() { window.mapObj = blist.datasetPage.rtManager.$domForType('map').socrataMap(); });
    })
    .waitFor(function() { return this.evaluate(function() { return mapObj._doneLoading; }); }, null,
        function timeout() { this.echo('More than 5 seconds; timed out.'); })
    .then(function()
    {
        this.echo('Took ' + (new Date().getTime() - profiler) / 1000 + 's');
        this.each(test.conditions, function(_self, condition) {
            if (condition.stringField)
            {
                _self.test.assert(this.evaluate(
                    function(stringField) { return $.deepGetStringField(mapObj, stringField); },
                    { stringField: condition.stringField }) === condition.value,
                bracket(test.comment) + condition.comment);
            }
            else if (condition.backgroundLayers)
            {
                _self.test.assert(this.evaluate(function(layerNames)
                    { return _.all(_.pluck(mapObj.map.backgroundLayers(), 'name'),
                        function(name, i) { return name == layerNames[i]; });
                    }, { layerNames: condition.value }),
                bracket(test.comment) + condition.comment);
            } 
        });
    });
});

casper.run(function() {
    this.test.renderResults();
    this.exit();
});
