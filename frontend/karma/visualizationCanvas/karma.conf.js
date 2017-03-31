var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'visualization-canvas.config.js',
  [ 'karma/visualizationCanvas' ]
);
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'public/javascripts/jquery-2.2.4.js',
      'karma/visualizationCanvas/index.js'
    ],
    webpack: webpackConfig
  }));
};
