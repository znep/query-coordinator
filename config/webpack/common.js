/* eslint-env node */
var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');
var ManifestPlugin = require('webpack-manifest-plugin');

var root = path.resolve(__dirname, '..', '..');
var packageJson = require(path.resolve(root, 'package.json'));
var isProduction = process.env.NODE_ENV == 'production';
var plugins = _.compact([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }),
  isProduction && new webpack.optimize.OccurenceOrderPlugin(),
  isProduction && new webpack.optimize.DedupePlugin(),
  isProduction && new webpack.optimize.UglifyJsPlugin({
    mangle: false,
    compress: {
      drop_console: true,
      warnings: false
    },
    output: {
      comments: false
    }
  })
]);

function getHotModuleEntries() {
  return isProduction ? [] : [
    'webpack-dev-server/client?https://0.0.0.0:' + packageJson.config.webpackDevServerPort,
    'webpack/hot/only-dev-server'
  ];
}

function getOutput(identifier) {
  var build = path.resolve(root, 'public/javascripts/build');

  return {
    path: isProduction ? path.resolve(build, identifier) : build,
    filename: isProduction ? '[name]-[hash].js' : identifier + '/[name].js',
    publicPath: isProduction ? '/javascripts/build' : '/javascripts/webpack'
  };
}

function getManifestPlugin(identifier) {
  return new ManifestPlugin({
    fileName: 'manifest.json',
    basePath: identifier + '/'
  });
}

module.exports = {
  root: root,
  packageJson: packageJson,
  devServerPort: packageJson.config.webpackDevServerPort,
  isProduction: isProduction,
  plugins: plugins,
  getHotModuleEntries: getHotModuleEntries,
  getOutput: getOutput,
  getManifestPlugin: getManifestPlugin
};
