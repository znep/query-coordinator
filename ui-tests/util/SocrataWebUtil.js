// SocrataWebUtil:
// Provides non-Socrata-specific utility code.
// Things to make working with selenium-webdriver easier.
var config = require('../test-config.js');
var expect = require('expect.js');
var webdriver = require('selenium-webdriver');
var fs = require('fs');

var SocrataWebUtil = function(driver)
{
    var socUtil = this;

    this.dumpScreen = function(filenamePrefix)
    {
        return driver.takeScreenshot().then(function(b)
        {
            fs.writeFileSync(filenamePrefix+'.png', new Buffer(b, 'base64'));
        });
    };
};

exports.SocrataWebUtil = SocrataWebUtil;
