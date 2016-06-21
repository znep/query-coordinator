/*eslint-env node */
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var webpackConfigDirectory = path.resolve(__dirname, 'webpack');

var webpackBundles = _.chain(process.env.FRONTEND_WEBPACK_BUNDLES || '').
  split(',').
  map(_.trim).
  filter('length').
  value();

function isWebpackConfig(filename) {
  return _.endsWith(filename, '.config.js');
}

function shouldBuild(filename) {
  var basename = path.basename(filename, '.config.js');
  return _.isEmpty(webpackBundles) || _.includes(webpackBundles, basename);
}

function getRequirePath(webpackConfig) {
  return path.resolve(__dirname, 'webpack', webpackConfig);
}

module.exports = fs.readdirSync(webpackConfigDirectory).
  filter(isWebpackConfig).
  filter(shouldBuild).
  map(getRequirePath).
  map(require);
