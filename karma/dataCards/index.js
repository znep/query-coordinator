// Miscellaneous dependencies that require global scope
window.DOMPurify = require('dompurify');
window._ = require('lodash');
window.socrata = window.socrata || {};
window.socrata.utils = require('socrata-utils');
require('angular-mocks');
require('script!rx-core-testing');
require('public/javascripts/util/jquery-extensions.js');
require('public/javascripts/util/dompurify-extensions.js');
require('public/javascripts/lib/RxExtensions.js');

// Initialize dataCards module
require('public/javascripts/angular/dataCards/module.js');

// Add test-specific modules and dependencies
require('../helpers/TestHelpers.js');
require('./mockTranslations.js');
angular.module('test').service('Mockumentary', require('public/javascripts/angular/dataCards/services/Mockumentary.js'));

beforeEach(function() {
  window._ = require('lodash');
  require('public/javascripts/util/lodash-mixins.js');
});

function requireAll(context) {
  context.keys().forEach(context);
}

// Require/run all the tests
requireAll(require.context('./controllers', true, /\.js$/));
requireAll(require.context('./decorators', true, /\.js$/));
requireAll(require.context('./directives', true, /\.js$/));
requireAll(require.context('./filters', true, /\.js$/));
requireAll(require.context('./models', true, /\.js$/));
requireAll(require.context('./services', true, /\.js$/));
requireAll(require.context('./util', true, /\.js$/));
