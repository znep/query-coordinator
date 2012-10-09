var casper = require('casper').create(),
    utils = require('utils');

var domain = 'opendata.test-socrata.com', sha;

if (casper.cli.args) { sha = casper.cli.args[0]; }

casper.start(['https:/', domain, 'version'].join('/'), function() {
    var curSha = this.fetchText({ type: 'xpath', path: '//dl[@class="versionInfo"]//dd[1]' });
    if (sha)
    { this.echo(curSha == sha); }
    else
    { this.echo(curSha); }
}).run();
