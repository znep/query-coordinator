var casper = require('casper').create(),
    utils = require('utils');

var domain = 'opendata.test-socrata.com';

casper.start(['https:/', domain, 'version'].join('/'), function() {
    this.echo(this.fetchText({ type: 'xpath', path: '//dl[@class="versionInfo"]//dd[1]' }));
}).run();
