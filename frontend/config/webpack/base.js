const path = require('path');
const webpackHelpers = require('./helpers');
const { getStyleguideIncludePaths } = require('../../../common/webpack/shared_config');

let preLoaders = [];

if (webpackHelpers.isProduction) {
  preLoaders.push(
    { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ }
  );
}

module.exports = {
  devtool: webpackHelpers.isProduction ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: {
    host: '0.0.0.0',
    https: true,
    port: webpackHelpers.devServerPort,
    quiet: false,
    noInfo: true,
    publicPath: '/javascripts/webpack/',
    stats: 'minimal',
    hot: true
  },
  module: {
    preLoaders,
    noParse: /node_modules\/@socrata\/mapbox-gl/
  },
  sassLoader: {
    includePaths: getStyleguideIncludePaths()
  },
  output: {
    pathinfo: !webpackHelpers.isProduction
  },
  resolveLoader: {
    modulesDirectories: [ path.resolve(webpackHelpers.frontendRoot, 'node_modules') ]
  },
  resolve: webpackHelpers.getStandardResolve(),
  postcss: () => [require('autoprefixer')]
};
