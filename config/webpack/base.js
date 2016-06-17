var path = require('path');
var _ = require('lodash');
var common = require('./common');

module.exports = {
  devtool: common.isProduction ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: {
    host: '0.0.0.0',
    https: true,
    port: common.devServerPort,
    quiet: false,
    noInfo: true,
    publicPath: '/javascripts/webpack',
    stats: 'minimal',
    hot: true
  },
  eslint: {
    configFile: common.isProduction ? '.eslintrc.json' : '.eslintrc-dev.json',
    formatter: require('eslint/lib/formatters/compact'),
    failOnError: false
  },
  module: {
    preLoaders: _.compact(common.isProduction ? null : [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }
    ])
  },
  output: {
    pathinfo: !common.isProduction
  },
  resolve: {
    modulesDirectories: [ 'node_modules', 'bower_components' ]
  }
};
