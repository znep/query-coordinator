var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var webpackConfigDirectory = path.resolve(__dirname, 'webpack');

function isWebpackConfig(filename) {
  return _.endsWith(filename, '.config.js');
}

function getRequirePath(webpackConfig) {
  return path.resolve(__dirname, 'webpack', webpackConfig);
}

module.exports = fs.readdirSync(webpackConfigDirectory).
  filter(isWebpackConfig).
  map(getRequirePath).
  map(require);
