var _ = require('lodash');
var path = require('path');
var rimraf = require('rimraf').sync;
var defaults = require(path.resolve('.', 'config/webpack.defaults.js'));

var configuration = (function(environment) {
  switch (environment) {
    case 'production':
      return require(
        path.resolve('.', 'config/environments/webpack.production.js')
      );
    case 'test':
      return require(
        path.resolve('.', 'config/environments/webpack.test.js')
      );
    case 'karma':
      return require(
        path.resolve('.', 'config/environments/webpack.karma.js')
      );
    default:
      return require(
        path.resolve('.', 'config/environments/webpack.development.js')
      );
  }
})(process.env.RAILS_ENV);

rimraf('public/js');

module.exports = _.merge(defaults, configuration);
