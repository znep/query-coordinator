var utils = require('./utils');
var Analytics = require('./Analytics');
var FeatureFlags = require('./FeatureFlags');

utils.Analytics = Analytics;
utils.FeatureFlags = FeatureFlags;

module.exports = utils;
