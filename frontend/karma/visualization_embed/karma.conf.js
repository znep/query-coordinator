var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'visualization_embed.config.js',
  [ 'karma/visualization_embed' ]
);
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'public/javascripts/jquery-2.2.4.js',
      'karma/visualization_embed/index.js'
    ],
    webpack: webpackConfig
  }));
};
