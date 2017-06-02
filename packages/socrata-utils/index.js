// Monorepo phase 1 (EN-14537):
// Compatibility shim so we can continue building an NPM package.
// Once all consumers of this library live in the monorepo, we
// can remove this file.
var utils = require('common/js_utils');
var Analytics = require('common/analytics').Analytics;
var FeatureFlags = require('common/feature_flags').FeatureFlags;

utils.Analytics = Analytics;
utils.FeatureFlags = FeatureFlags;

module.exports = utils;
