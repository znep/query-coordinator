/* eslint-env node */
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');
var ManifestPlugin = require('webpack-manifest-plugin');

var root = path.resolve(__dirname, '..', '..');
var packageJson = require(path.resolve(root, 'package.json'));
// realpathSync is used to support "npm link socrata-components"
var socrataComponentsPath = fs.realpathSync(path.resolve(root, 'node_modules/socrata-components'));

var isProduction = process.env.NODE_ENV == 'production';
var plugins = _.compact([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }),
  isProduction && new webpack.optimize.OccurenceOrderPlugin(),
  !isProduction && new webpack.EvalSourceMapDevToolPlugin(),
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
    filename: isProduction ? '[name].js' : identifier + '/[name].js',
    chunkFilename: isProduction ? '[name].js?[chunkhash]' : identifier + '/[name].js?[chunkhash]',
    publicPath: isProduction ? '/javascripts/build/' + identifier + '/' : '/javascripts/webpack/'
  };
}

function getManifestPlugin(identifier) {
  return new ManifestPlugin({
    fileName: 'manifest.json',
    basePath: identifier + '/'
  });
}

function getEslintConfig(configFile) {
  return {
    configFile: path.resolve(root, configFile),
    formatter: require('eslint/lib/formatters/compact'),
    failOnError: false
  };
}


function getStyleguidePreLoaders() {
  return [
    {
      test: /\.jsx?$/,
      include: [ socrataComponentsPath ],
      loader: 'babel-loader',
      query: { presets: ['react', 'es2015'] }
    },
    {
      test: /\.(eot|woff|svg|woff2|ttf)$/,
      loader: 'url-loader?limit=100000',
      exclude: path.join(socrataComponentsPath, 'dist/fonts/svg')
    }
  ];
}

function getStyleguideIncludePaths() {
  return [
    'node_modules/bourbon/app/assets/stylesheets',
    'node_modules/bourbon-neat/app/assets/stylesheets',
    'node_modules/breakpoint-sass/stylesheets',
    'node_modules/modularscale-sass/stylesheets',
    'node_modules/normalize.css',
    socrataComponentsPath,
    path.join(socrataComponentsPath, 'styles'),
    path.join(socrataComponentsPath, 'styles/variables'),
    path.join(socrataComponentsPath, 'styles/partials'),
    path.join(socrataComponentsPath, 'dist/fonts'),
    'node_modules/react-input-range/dist',
    'node_modules/react-datepicker/dist'
  ];
}

module.exports = {
  devServerPort: packageJson.config.webpackDevServerPort,
  getEslintConfig: getEslintConfig,
  getHotModuleEntries: getHotModuleEntries,
  getManifestPlugin: getManifestPlugin,
  getOutput: getOutput,
  getStyleguideIncludePaths: getStyleguideIncludePaths,
  getStyleguidePreLoaders: getStyleguidePreLoaders,
  isProduction: isProduction,
  packageJson: packageJson,
  plugins: plugins,
  root: root
};
