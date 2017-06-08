var webpackCommon = require('../../config/webpack/common');

var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'base',
  [ 'public/javascripts/common', 'karma/common' ]
);
webpackConfig.module.loaders = webpackCommon.getStandardLoaders();

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'karma/common/index.js'
    ],
    webpack: webpackConfig
  }));
};
