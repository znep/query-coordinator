var _ = require('lodash');
var path = require('path');
var common = require('./common');

module.exports = {
  devtool: common.isProduction ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: {
    host: '0.0.0.0',
    https: true,
    port: common.devServerPort,
    quiet: false,
    noInfo: true,
    publicPath: '/javascripts/webpack/',
    stats: 'minimal',
    hot: true
  },
  module: {
    preLoaders: _.compact([
      common.isProduction ? null : { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ },
      ...common.getStyleguidePreLoaders()
    ])
  },
  sassLoader: {
    includePaths: [
      ...common.getStyleguideIncludePaths()
    ]
  },
  output: {
    pathinfo: !common.isProduction
  },
  resolveLoader: {
    modulesDirectories: [ path.resolve(common.frontendRoot, 'node_modules') ]
  },
  resolve: common.getStandardResolve()
};
