const path = require('path');
const common = require('./common');
const { getStyleguideIncludePaths } = require('../../../common/webpack/shared_config');

let preLoaders = [];

if (common.isProduction) {
  preLoaders.push(
    { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ }
  );
}

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
    preLoaders,
    noParse: /node_modules\/@socrata\/mapbox-gl/
  },
  sassLoader: {
    includePaths: getStyleguideIncludePaths()
  },
  output: {
    pathinfo: !common.isProduction
  },
  resolveLoader: {
    modulesDirectories: [ path.resolve(common.frontendRoot, 'node_modules') ]
  },
  resolve: common.getStandardResolve(),
  postcss: () => [require('autoprefixer')]
};
