/* eslint-env node */

var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');
var ManifestPlugin = require('webpack-manifest-plugin');

var frontendRoot = path.resolve(__dirname, '..', '..');
var packageJson = require(path.resolve(frontendRoot, 'package.json'));
const svgFontPath = path.resolve(frontendRoot, '../common/resources/fonts/svg');

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
      warnings: false
    },
    output: {
      comments: false
    }
  })
]);

// Base `test` and `include` config for loaders
// operating on javascript/JSX code.
var jsLoaderBaseConfig = {
  test: /\.jsx?$/,
  include: [
    path.resolve(frontendRoot, 'public/javascripts'),
    path.resolve(frontendRoot, 'karma'),
    path.resolve(frontendRoot, '../common')
  ]
};

function withHotModuleEntries(entry) {
  var hotModuleEntries = getHotModuleEntries();

  var entryPoints = {};
  // Assume name is main because:
  // https://github.com/webpack/webpack/blob/951a7603d279c93c936e4b8b801a355dc3e26292/bin/convert-argv.js#L498-L502
  if (_.isString(entry)) {
    entryPoints.main = [entry].concat(hotModuleEntries);
  } else if (_.isArray(entry)) {
    entryPoints.main = entry.concat(hotModuleEntries);
  } else {
    entryPoints = _.mapValues(entry, function(v) {
      return _.castArray(v).concat(hotModuleEntries);
    });
  }
  return entryPoints;
}

function getHotModuleEntries() {
  return isProduction ? [] : [
    'webpack-dev-server/client?https://0.0.0.0:' + packageJson.config.webpackDevServerPort,
    'webpack/hot/only-dev-server'
  ];
}

function getOutput(identifier) {
  var build = path.resolve(frontendRoot, 'public/javascripts/build');

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
    configFile: path.resolve(frontendRoot, configFile),
    formatter: require('eslint/lib/formatters/compact'),
    failOnError: false
  };
}


function getStyleguidePreLoaders() {
  return [
    {
      test: /\.svg$/,
      loader: require.resolve('raw-loader'),
      include: svgFontPath
    },
    {
      test: /\.(eot|woff|svg|woff2|ttf)$/,
      loader: 'url-loader?limit=100000',
      exclude: svgFontPath
    }
  ];
}

// Sets the search path for @include directives SPECIFICALLY in *.scss files.
function getStyleguideIncludePaths() {
  return [
    'node_modules/bourbon/app/assets/stylesheets',
    'node_modules/bourbon-neat/app/assets/stylesheets',
    'node_modules/breakpoint-sass/stylesheets',
    'node_modules/modularscale-sass/stylesheets',
    'node_modules/normalize.css',
    'node_modules/react-input-range/dist',
    'node_modules/react-datepicker/dist',
    path.resolve(frontendRoot, '../')
  ];
}

function getBabelLoader() {
  return _.extend({}, jsLoaderBaseConfig, {
    loader: 'babel',
    query: {
      // Manually resolve these plugins and presets to work around
      // webpack require path issues.
      presets: [
        'babel-preset-es2015',
        'babel-preset-react'
      ].map(require.resolve),
      plugins: [
        'babel-plugin-transform-object-rest-spread'
      ].map(require.resolve)
    }
  });
}

function getReactHotLoader() {
  return _.extend({}, jsLoaderBaseConfig, {
    loader: 'react-hot'
  });
}

function getStandardLoaders() {
  var loaders = [];

  if (!isProduction) {
    loaders.push(getReactHotLoader());
  }

  loaders.push(getBabelLoader());

  return loaders;
}

// Returns the standard resolve config, with
// an option to include extra roots.
// Example:
//
// var myWebpackConfig = {
//   resolve: getStandardResolve([ 'public/javascripts/datasetLandingPage' ])
// };
function getStandardResolve(extraRoots) {
  extraRoots = extraRoots || [];
  var roots = [
    path.resolve(frontendRoot, '..')
  ];

  _.each(extraRoots, function(extraRoot) {
    roots.push(path.resolve(frontendRoot, extraRoot));
  });

  return {
    modulesDirectories: [ path.resolve(frontendRoot, 'node_modules') ],
    root: roots
  };
}

function resolvePath(relativePath) {
  return path.resolve(frontendRoot, relativePath);
}

module.exports = {
  devServerPort: packageJson.config.webpackDevServerPort,
  getEslintConfig: getEslintConfig,
  withHotModuleEntries: withHotModuleEntries,
  getBabelLoader: getBabelLoader,
  getReactHotLoader: getReactHotLoader,
  getHotModuleEntries: getHotModuleEntries,
  getManifestPlugin: getManifestPlugin,
  getOutput: getOutput,
  getStandardLoaders: getStandardLoaders,
  getStyleguideIncludePaths: getStyleguideIncludePaths,
  getStyleguidePreLoaders: getStyleguidePreLoaders,
  getStandardResolve: getStandardResolve,
  isProduction: isProduction,
  packageJson: packageJson,
  plugins: plugins,
  resolvePath: resolvePath,
  svgFontPath: svgFontPath,
  frontendRoot: frontendRoot
};
