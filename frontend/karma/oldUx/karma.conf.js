var webpackCommon = require('../../config/webpack/common');
var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'base',
  [ 'public/javascripts/common', 'public/javascripts/src', 'karma/oldUx' ]
);
webpackConfig.module.loaders = [ webpackCommon.getBabelLoader() ];

module.exports = function (karma) {
  karma.set(karmaConfig({
    preprocessors: {
       'karma/oldUx/**/*-test.js': ['webpack'],
       'karma/oldUx/**/*Test.js': ['webpack']
    },

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      /* The order of this matters. */

      // Libraries
      'public/javascripts/jquery-1.7.1.js',
      'public/javascripts/plugins/lodash.js',
      'public/javascripts/plugins/moment.min.js',

      /* END OF EXTERNAL DEPENDENCIES
       * OUR CODE BELOW */

      /* Old UX */
      // Began implementing this for dataset-show-test, but its dependencies were breaking
      // many other tests, so leaving it out for now.
      'public/javascripts/util/namespace.js',
      'public/javascripts/util/util.js',
      'public/javascripts/plugins/inheritance.js',
      'public/javascripts/util/base-model.js',
      'public/javascripts/util/socrata-server.js',
      'public/javascripts/util/geo-helpers.js',
      'public/javascripts/util/jsonquery-helpers.js',
      'public/javascripts/util/legacy-query-helpers.js',
      'public/javascripts/util/dataset/create-dataset-from-view.js',
      'public/javascripts/util/dataset/tabular-dataset.js',
      'public/javascripts/util/read-only-view.js',
      'public/javascripts/util/view-persistor.js',
      'public/javascripts/util/view-renderer.js',
      'public/javascripts/util/soda-1-data-provider.js',
      'public/javascripts/util/dataset/dataset.js',
      'public/javascripts/util/dataset/column.js',
      'public/javascripts/util/dataset/column-container.js',
      'public/javascripts/util/dataset/row-set.js',
      'public/javascripts/util/view-cache.js',
      'public/javascripts/util/filter.js',
      'karma/oldUx/feature_flag_faker.js',
      'public/javascripts/controls/table/socrata-viz-dataset-grid.js',

      // Utilities/Libraries
      'public/javascripts/plugins/html4-defs.js',
      'public/javascripts/plugins/html-sanitizer.js',
      'public/javascripts/plugins/html2markdown.js',
      'public/javascripts/component/util/html-sanitizer-utils.js',

      // Test Files
      'karma/oldUx/**/*.js',
      // https://github.com/karma-runner/karma/issues/1532
      { pattern: 'public/stylesheets/images/*', watched: false, included: false, served: true },
      { pattern: 'public/stylesheets/images/common/*', watched: false, included: false, served: true }
    ],

    proxies: {
      '/stylesheets/images/': `http://localhost:${karma.port}/base/public/stylesheets/images/`,
      '/stylesheets/images/common/': `http://localhost:${karma.port}/base/public/stylesheets/images/common/`
    },

    frameworks: [ 'mocha' ],

    webpack: webpackConfig
  }));
};
