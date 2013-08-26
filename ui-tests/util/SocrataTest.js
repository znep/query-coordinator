// SocrataTest:
// This class provides the main means of writing expressive tests for the
// Socrata web front-end. It provides these facilities:
// - A selenium webclient enhanced with socrata-specific API (see SocrataClient.js)
//   and miscellaneous useful methods (see SocrataWebUtil.js).
// - Test framework specific features, such as auto-snapshotting on failure.
// - Management of webclient lifetime (it needs to be properly disposed on suite end).

var config = require('../test-config.js');
var SocrataClient = require('./Socrata/SocrataClient.js').SocrataClient;
var SocrataWebUtil = require('./SocrataWebUtil.js').SocrataWebUtil;

var _ = require('underscore');
var webdriver = require('selenium-webdriver');

var expect = require('expect.js');
var fs = require('fs');
var url = require('url');

///// PUBLIC API /////

var SocrataTest = function(suites)
{
   var tt = this;
   tt._enabledFeatures = {};
   _.each(suites, function(suite)
   {
      suite.afterEach(function(done)
      {
         var test = this.currentTest;
         tt._onAfterEach(test, done);
      });
   });
};

// Creates a selenium-webclient driver instance specific for this test. The second and subsequent
// calls to this function do not create additional clients. Returns the new or existing client.
// In addition to the normal selenium-webclient API, it contains some additional
// fields:
// - socUtil:  Miscellaneous non-Socrata specific helpers that could possibly be in selenium-webdriver.
//             see SocrataWebUtil.js.
// - socrata:  Socrata-specific API in the style of selenium-webclient's API. See SocrataClient.js.
//             For instance, provides login and dataset functionality.
SocrataTest.prototype.createClient = function()
{
   if (this._client) { return this._client; }

   var driver = new webdriver.Builder().
           withCapabilities(config.seleniumRemoteOptions.capabilities).
           build();

   this._client = driver;

   driver.socrata = new SocrataClient(driver);
   driver.socUtil = new SocrataWebUtil(driver);

   return driver;
};

// Clean up this instance. It MUST be called when you're done!
SocrataTest.prototype.end = function(done)
{
   var cl = this.currentClient();
   if (cl)
   {
      cl.socrata.dataset._destroy().then(function()
      {
         cl.quit().then(done);
      });
   }
   else
   {
      done();
   }
};

// Returns the client, if any, created by createClient.
SocrataTest.prototype.currentClient = function() { return this._client; };

// Enables (default) or disables automatic image snapshot on test failure.
SocrataTest.prototype.enableScreenshotOnFailure = function(doEnable)
{
   this._enabledFeatures.screenShotOnFailure = _.isUndefined(doEnable) ? true : doEnable;
   return this;
};

// Gets a relative page from the current site under test.
SocrataTest.prototype.relUrl = function(relpath)
{
   return url.resolve(config.server.url, relpath);
};

// E.T. go homepage
SocrataTest.prototype.goHome = function()
{
   return this.currentClient().get(this.relUrl(''));
};

///// GUTS /////

SocrataTest.prototype._dumpScreenShotIfFailed = function(test)
{
   if (test.state !== 'failed') { return; }

   var cl = this.currentClient();
   if (!cl || !this._enabledFeatures.screenShotOnFailure) { return; }

   var failingTest = test.title;
   var dir = config.failureImageDumpBasePath + config.testRunId;
   if (!fs.existsSync(dir))
   {
      fs.mkdirSync(dir);
   }
   var fnPrefix = dir+'/failure-' + failingTest;
   cl.socUtil.dumpScreen(fnPrefix);
};

SocrataTest.prototype._onAfterEach = function(test, done)
{
   this._dumpScreenShotIfFailed(test);
   done();
};

///// EXPORTS /////

exports.socrataTest = function(test)
{
   return new SocrataTest(test.parent.suites);
};

