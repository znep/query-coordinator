var karmaConfig = require('../helpers/karma_config');
var _ = require('lodash');
var common = require('../../config/webpack/common');

var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'data-cards.config.js',
  [ 'karma/dataCards', '.', 'public/javascripts' ]
);

// The style and template paths don't quite match up with what the runtime
// webpack config expects (not 100% sure why).
_.set(webpackConfig, 'sassLoader.includePaths', [ 'app/styles' ]);
_.set(webpackConfig, 'resolve.alias.angular_templates', common.resolvePath('public/angular_templates'));

// Allows us to load json fixture files.
webpackConfig.module.loaders.push( {
  test: /\.json$/,
  loader: 'json-loader'
});

webpackConfig.module.loaders.push( {
  test: /angular\-mocks/,
  loader: 'imports-loader',
  query: { angular: 'angular' }
});


module.exports = function (karma) {
  karma.set(karmaConfig({
    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/js-polyfills/timing.js',
      'public/javascripts/util/polyfills.js',
      'public/javascripts/plugins/squire.js',
      'public/javascripts/plugins/url.js',

      // https://github.com/karma-runner/karma/issues/1532
      { pattern: 'public/images/dataCards/**/*.???', watched: false, included: false, served: true },
      { pattern: 'public/stylesheets/images/common/*', watched: false, included: false, served: true },

      // Tests
      'karma/dataCards/index.js'
    ],

    proxies: {
      '/images/dataCards': `http://localhost:${karma.port}/base/public/images/dataCards`,
      '/javascripts/plugins/': `http://localhost:${karma.port}/base/public/javascripts/plugins/`,
      '/stylesheets/images/common/': `http://localhost:${karma.port}/base/public/stylesheets/images/common/`
    },

    frameworks: ['mocha'],

    webpack: webpackConfig
  }));
};
