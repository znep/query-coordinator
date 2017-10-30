/* eslint-env node */

var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');
var ManifestPlugin = require('webpack-manifest-plugin');

var frontendRoot = path.resolve(__dirname, '..', '..');
var packageJson = require(path.resolve(frontendRoot, 'package.json'));
const svgFontPath = path.resolve(frontendRoot, '../common/resources/fonts/svg');

var isProduction = process.env.NODE_ENV === 'production';

var plugins = _.compact([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
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
  }),
  !isProduction && new webpack.HotModuleReplacementPlugin()
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
  return _.mapValues(entry, function(v) {
    const hotModuleEntries = getHotModuleEntries().concat(_.castArray(v));
    return ['babel-polyfill-safe', ...hotModuleEntries];
  });
}

function getHotModuleEntries() {
  return isProduction ? ['react-hot-loader/patch'] : [
    'react-hot-loader/patch',
    `webpack-dev-server/client?https://0.0.0.0:${packageJson.config.webpackDevServerPort}`,
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

function getSvgAndFontLoaders() {
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

function getBabelLoader(extraPlugins = []) {
  const babelPlugins = [ 'babel-plugin-transform-object-rest-spread', 'react-hot-loader/babel' ].concat(extraPlugins);

  return _.extend({}, jsLoaderBaseConfig, {
    loader: 'babel',
    query: {
      // Manually resolve these plugins and presets to work around
      // webpack require path issues.
      presets: [
        'babel-preset-es2015',
        'babel-preset-react'
      ].map(require.resolve),
      plugins: babelPlugins.map(require.resolve)
    }
  });
}

// Returns an array of loaders considered standard across the entire frontend app, except for the "open-data"
// bundle. Includes an ES2015 + React preset for babel, and icon font loader
function getStandardLoaders(extraLoaders, options) {
  let loaders = Array.from(extraLoaders || []);
  const babelPlugins = [];

  options = _.extend({
    babelRewirePlugin: false // Only has effect outside of production.
  }, options);

  if (!isProduction && options.babelRewirePlugin) {
    babelPlugins.push('babel-plugin-rewire');
  }

  loaders.push(getBabelLoader(babelPlugins));
  loaders = loaders.concat(getSvgAndFontLoaders());

  // Prevent lodash from putting itself on window.
  // See: https://github.com/lodash/lodash/issues/2671
  loaders.push({
    test: /node_modules\/lodash/,
    loader: 'imports?define=>undefined'
  });

  // dotdotdot isn't module-friendly and relies
  // on a window'd version of jQuery. Here, we provide
  // that global jQuery by forcibly injecting the instance that will
  // be used by other modules.
  loaders.push({
    test: /jquery\.dotdotdot\.min\.js$/,
    loader: 'imports?jQuery=jquery,$=jquery'
  });

  loaders.push({
    test: /\.json$/,
    loader: require.resolve('json-loader')
  });

  loaders.push({
    test: /\.yml$|\.yaml$/,
    loaders: ['json', 'yaml']
  });

  if (options.substituteStyleLoaders) {
    if (_.isArray(options.substituteStyleLoaders)) {
      loaders = loaders.concat(options.substituteStyleLoaders);
    } else {
      loaders.push(options.substituteStyleLoaders);
    }
  } else {
    loaders.push({
      test: /^((?!\.global).)*(scss|css)$/, // All *.?css files but _not_ the .global.scss file
      loaders: [
        'style-loader?sourceMap',
        'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
        'postcss-loader', // See postcss: key in platform-ui/frontend/config/webpack/base.js
        'sass-loader'
      ]
    });
  }

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
    modulesDirectories: [
      path.resolve(frontendRoot, 'node_modules'),
      path.resolve(frontendRoot, 'public/javascripts')
    ],
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
  getHotModuleEntries: getHotModuleEntries,
  getManifestPlugin: getManifestPlugin,
  getOutput: getOutput,
  getStandardLoaders: getStandardLoaders,
  getSvgAndFontLoaders: getSvgAndFontLoaders,
  getStandardResolve: getStandardResolve,
  isProduction: isProduction,
  packageJson: packageJson,
  plugins: plugins,
  resolvePath: resolvePath,
  svgFontPath: svgFontPath,
  frontendRoot: frontendRoot
};
