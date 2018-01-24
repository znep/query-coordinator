var karmaConfig = require('../helpers/karma_config');
var webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'shared.config.js',
  [ 'karma/approvals' ],
  [ 'approvals' ]
);

module.exports = function ( karma ) {
  karma.set(karmaConfig({
    files: [
      'karma/approvals/index.js'
    ],
    webpack: webpackConfig
  }));
};
