var webpackHelpers = require('../../config/webpack/helpers');

var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'base',
  [ 'public/javascripts/common', 'karma/common' ]
);
webpackConfig.module.loaders = webpackHelpers.getStandardLoaders();

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/common/index.js'
    ],
    webpack: webpackConfig
  }));
};
