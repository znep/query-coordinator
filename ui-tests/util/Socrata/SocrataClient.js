// SocrataClient:
//  Socrata-specific API in the style of selenium-webclient's API.
//  For instance, provides login and dataset functionality.

var config = require('../../test-config.js');
var expect = require('expect.js');
var _ = require('underscore');
var webdriver = require('selenium-webdriver');
var fs = require('fs');

var dataset = require('./dataset.js').dataset;

var SocrataClient = function(driver)
{
    this._driver = driver;
    var sc = this;

    this.dataset = new dataset(this);

    this.signOut = function()
    {
        return this.getCurrentUserEmail().then(function(user)
        {
            if (user)
            {
                driver.get(config.server.url.href+'/logout');
                sc.getCurrentUserEmail().then(function(un)
                {
                    expect(un).to.be(null);
                });
            }
        });
    };

    this.ensureLoggedInAs = function(un, pw)
    {
        return this.getCurrentUserEmail().then(function(user)
        {
            var doLogIn = function()
            {
                driver.get(config.server.url.href+'/login');
                driver.findElement(webdriver.By.id('user_session_login')).sendKeys(un);
                driver.findElement(webdriver.By.id('user_session_password')).sendKeys(pw);
                driver.findElement(webdriver.By.id('new_user_session')).submit();
            };

            sc.signOut().then(doLogIn);
        });
    };

    this.getCurrentUserEmail = function()
    {
        return driver.executeScript('return typeof($) === "undefined" ? null : $.deepGet(blist, "currentUser", "email")');
    };

    this.ensureLoggedIn = function()
    {
        return this.ensureLoggedInAs(config.server.username, config.server.password);
    };

    this.isLoggedIn = function()
    {
        var def = webdriver.promise.defer();

        this.getCurrentUserEmail().then(function (email)
        {
            def.fulfill(!_.isEmpty(email));
        });

        return def;
    };

    this.getLoginCookies = function()
    {
        // Cookies are _not_ a sometimes food, Sesame Street!
        var def = webdriver.promise.defer();

        this.getCurrentUserEmail().then(function (email)
        {
            driver.manage().getCookies().then(function(cookies)
            {
                var loginCookies = [
                    '_core_session_id',
                    '_socrata_session_id',
                    'logged_in',
                    'socrata-csrf-token'];

                filtered = _.filter(cookies, function(cookie)
                {
                    return _.contains(loginCookies, cookie.name);
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
    }
};

exports.SocrataClient = SocrataClient;
