var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'approvals.config.js',
  [ 'karma/approvals', 'public/javascripts' ]
);

// In Rails, some modules are handled specially. We don't want that for tests.
delete webpackConfig.resolve.alias;
webpackConfig.externals = {
  jquery: 'jQuery'
};

module.exports = function ( karma ) {
  karma.set(karmaConfig({
    files: [
      'karma/approvals/index.js'
    ],
    webpack: webpackConfig
  }));
};
