// This is necessary for some tests because they check layout and require the vis styles to be loaded.
import 'common/visualizations/views/styles/socrata-visualizations.scss';

// Miscellaneous dependencies that require global scope
window._ = require('lodash');
window.socrata = window.socrata || {};
window.socrata.utils = require('common/js_utils');

require('angular-mocks');
require('imports?Rx=rx!script!rx-core-testing');
require('script!dotdotdot');
require('script!javascript-detect-element-resize/jquery.resize.js');
require('script!public/javascripts/util/jquery-extensions.js');
require('imports?DOMPurify=dompurify!public/javascripts/util/dompurify-extensions');
require('public/javascripts/lib/RxExtensions.js');

// This is required by common/components.
// TODO: figure out why we need to do this when we aren't using common/components.
require('babel-polyfill-safe');

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
requireAll(require.context('.', true, /Test\.js$/));
