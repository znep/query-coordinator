var karmaConfig = require('../helpers/karma_config');
var _ = require('lodash');
var common = require('../../config/webpack/common');

var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'data-cards.config.js',
  [ 'karma/dataCards', '.', 'public/javascripts' ]
);

// The style paths don't quite match up with what the runtime
// webpack config expects (not 100% sure why).
webpackConfig.sassLoader.includePaths.push('app/styles');
// webpackConfig.resolve.alias.angular_templates = common.resolvePath('public/angular_templates');

webpackConfig.module.loaders.push({
  test: /angular\-mocks/,
  loader: 'imports-loader',
  query: { angular: 'angular' }
});

// To make tests easier to write, we disable auto scss class prefixes. Copied from DSMUI config.
const styleLoaderWithDisabledAutoScssClassPrefixes =
  'style?sourceMap!css?modules&localIdentName=[local]&importLoaders=1!postcss!sass';
const styleLoader = _(webpackConfig.module.loaders).find((loader) =>
  _.get(loader, 'loader', '').indexOf('localIdentName') >= 0
);

if (styleLoader) {
  styleLoader.loader = styleLoaderWithDisabledAutoScssClassPrefixes;
} else {
  // Sometimes loader is actually loaders - an array instead of a string
  _(webpackConfig.module.loaders).each((loader) => {
    const styleLoaders = _.get(loader, 'loaders');
    if (styleLoaders) {
      _(styleLoaders).each((entry, index) => {
        if (entry.indexOf('localIdentName') >= 0) {
          styleLoaders[index] = styleLoaderWithDisabledAutoScssClassPrefixes;
        }
      })
    }
  });
}

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
