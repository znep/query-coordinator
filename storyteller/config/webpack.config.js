var _ = require('lodash');
var path = require('path');
var rimraf = require('rimraf').sync;
var webpackConfig = require(path.resolve('.', 'config/webpack.defaults.js'));
var defaults = webpackConfig.withExtraBabelPlugins();

var configuration = (function(environment) {
  switch (environment) {
    case 'production':
      return _.merge(defaults, require(
        path.resolve('.', 'config/environments/webpack.production.js')
      ));
    case 'test':
      return _.merge(defaults, require(
        path.resolve('.', 'config/environments/webpack.test.js')
      ));
    case 'karma':
      return _.merge(webpackConfig.withExtraBabelPlugins(['babel-plugin-rewire']), require(
        path.resolve('.', 'config/environments/webpack.karma.js')
      ));
    default:
      return _.merge(defaults, require(
        path.resolve('.', 'config/environments/webpack.development.js')
      ));
  }
})(process.env.RAILS_ENV);

rimraf('public/js');

module.exports = configuration;
