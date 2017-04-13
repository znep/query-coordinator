var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'dataset-landing-page.config.js',
  [ 'karma/datasetLandingPage' ]
);
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'public/javascripts/jquery-2.2.4.js',
      'karma/datasetLandingPage/index.js',
      { pattern: 'karma/datasetLandingPage/data/*.png', watched: false, included: false, served: true }
    ],

    proxies: {
      '/image.png': `http://localhost:${karma.port}/base/karma/datasetLandingPage/data/mockImage.png`,
      '/api/file_data/guid': `http://localhost:${karma.port}/base/karma/datasetLandingPage/data/mockImage.png`
    },
    webpack: webpackConfig
  }));
};