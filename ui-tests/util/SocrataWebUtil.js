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
    var _flow = webdriver.promise.controlFlow();

    this.dumpScreen = function(filenamePrefix)
    {
        return driver.takeScreenshot().then(function(b)
        {
            fs.writeFileSync(filenamePrefix+'.png', new Buffer(b, 'base64'));
        });
    };

    // Takes an array of cookie names.
    // Returns a promise that evaluates to a hash of cookie names to values.
    // Also includes a CookieHeader value that is the header-friendly concatenation
    // of all requested cookies.
    this.getCookiesList = function(cookieNameArray)
    {
        return _flow.execute(function()
        {
            // Cookies are _not_ a sometimes food, Sesame Street!
            var def = webdriver.promise.defer();

            this.getCurrentUserEmail().then(function (email)
            {
                driver.manage().getCookies().then(function(cookies)
                {
                    filtered = _.filter(cookies, function(cookie)
                    {
                        return _.contains(cookieNameArray, cookie.name);
                    });

                    var ret = {};

                    _.each(filtered, function(cookie)
                    {
                        ret[cookie.name] = cookie.value;
                    });

                    ret.CookieHeader = _.map(ret, function(v, k)
                    {
                        return k + '=' + v;
                    }).join('; ');

                    def.fulfill(ret);
                });
            });

            return def;
        });
    };
};

exports.SocrataWebUtil = SocrataWebUtil;
