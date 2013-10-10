// This file controls the behavior of the tests.
// It's responsible for parsing the command line options.

var argv = require('optimist')
           .argv;

var url = require('url');
var https = require('https');
var webdriver = require('selenium-webdriver');

// Config external modules
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // For Superagent.
https.globalAgent.options.rejectUnauthorized = false; // Should be sufficient for everything else.

var errors = [];
var addVerificationError = function(err) { errors.push(err); };
var verify = function(cond, err)
{
    if (!cond) { addVerificationError(err); }
    return cond;
};

exports.errors = errors;

// --browser
var desiredBrowser = argv.browser || 'phantomjs';

if (verify(webdriver.Capabilities[desiredBrowser], "Invalid browser: " + desiredBrowser))
{
    var seleniumRemoteOptions = {
        capabilities: webdriver.Capabilities[desiredBrowser]().
                      set(webdriver.Capability.ACCEPT_SSL_CERTS, true)
        };

    if (desiredBrowser == 'phantomjs')
    {
        // Often dev servers don't have proper ssl certs. So be trusting.
        // Sadly this is broken in phantom, should be fixed at some point:
        // https://github.com/detro/ghostdriver/issues/233
        // This is the workaround.
        seleniumRemoteOptions.capabilities.set('phantomjs.cli.args', '--ignore-ssl-errors=true');
    }
}

// --against
var baseURL = argv.against || 'https://localhost:9443';
var parsedURL = url.parse(baseURL);
verify(parsedURL.protocol === 'https:', "Protocol of target site must be https.");
verify(parsedURL.hostname.indexOf('.socrata.com') == -1, "Testing against prod is not advisable yet!");

// --user, --password, --token
var username = argv.username || process.env.SOCRATA_TEST_UN;
var password = argv.password || process.env.SOCRATA_TEST_PW;
var token = argv.token || process.env.SOCRATA_TEST_TOKEN; //TODO just grab from site?

verify(username, "Username required. You may be interested in cache-auth.sh.");
verify(password, "Password required. You may be interested in cache-auth.sh.");
verify(token, "API token required. You may be interested in cache-auth.sh.");

exports.seleniumRemoteOptions = seleniumRemoteOptions;
exports.server = {
    url: parsedURL,
    username: username,
    password: password,
    token: token,
    authHeader: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
};


exports.printActiveConfig = function()
{
    console.log("Against: " + exports.server.url.href);
    console.log("Browser: " + exports.seleniumRemoteOptions.capabilities.get(webdriver.Capability.BROWSER_NAME));
    console.log("User: " + exports.server.username);
};

exports.failureImageDumpBasePath = 'failures/';
exports.testRunId = function()
{
    return 'tr-' + new Date().toISOString();
}();

// --auditDatasetLifetime, --preserveCreatedDatasets
exports.datasets = {
    auditDatasetLifetime: argv.auditDatasetLifetime,
    preserveCreatedDatasets: argv.preserveCreatedDatasets,
};
