/*eslint-env node */
/*eslint strict: 0 */

var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var ManifestPlugin = require('webpack-manifest-plugin');
var _ = require('lodash');

var projectRootDir = path.resolve(__dirname, '..');

// package.json holds shared configuration
var packageJson = require(path.resolve(projectRootDir, 'package.json'));
var devServerPort = packageJson.config.webpackDevServerPort;
var datalensWebpackExternals = packageJson.config.datalensWebpackExternals;

var jsDir = path.resolve(projectRootDir, 'public/javascripts');
var buildDir = path.resolve(jsDir, 'build');

function isProduction() {
  return process.env.NODE_ENV == 'production';
}

// Filter function for if a file is a JavaScript file
function isJsFile(filename) { return path.extname(filename) == '.js'; }

// Mapping function from filename to filename without 'js' extension
function nameWithoutExt(filename) { return filename.replace(/\.js$/, ''); }

// Get the top-level JS files in a directory and return as an array of IDs
function getEntriesInDir(srcDir) {
  return fs.readdirSync(srcDir).
    filter(isJsFile).
    map(nameWithoutExt);
}

// Map a list of entry IDs to an object that can be used by webpack as a bundle 'entry'
function getEntryObjectFromArray(entries, additionalEntries) {
  return entries.
    reduce(function(acc, entryPoint) {
      var devServerClient = (isProduction() ?
        null :
        'webpack-dev-server/client?https://localhost:' + devServerPort
      );
      acc[entryPoint[0]] = _.compact([devServerClient].
        concat(additionalEntries, entryPoint[1]));
      return acc;
    }, {});
}

// Returns an array of the plugins to use based on the environment
function getPlugins() {
  var plugins = [];

  plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  );

  if (isProduction()) {
    plugins.push(
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        mangle: true,
        compress: {
          drop_console: true,
          warnings: false
        },
        output: {
          comments: false
        }
      })
    );
  }

  return plugins;
}


// Base configuration for both bundle configs
// Sets up dev-server configuration and some paths
var baseConfig = {
  devtool: isProduction() ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: {
    host: '0.0.0.0',
    https: true,
    port: devServerPort,
    quiet: false,
    noInfo: true,
    publicPath: '/javascripts/webpack',
    stats: { colors: true }
  },
  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ }
    ]
  },
  output: {
    path: buildDir,
    pathinfo: !isProduction(),
    publicPath: isProduction() ? '/javascripts/build' : '/javascripts/webpack'
  },
  resolve: {
    modulesDirectories: [ 'node_modules', 'bower_components' ]
  }
};

// Generates the configuration for the old UX
// Adds react-centric configuration
function generateOldUxConfig() {
  var srcDir = path.resolve(jsDir, 'src/screens');
  var entries = getEntriesInDir(srcDir);

  console.log('Building oldUx entrypoints: ', entries);

  var entry = getEntryObjectFromArray(
    entries.map(function(entryPoint) { return [entryPoint, './screens/' + entryPoint]; }),
    isProduction() ? null : 'webpack/hot/only-dev-server'
  );

  return _.defaultsDeep({
    context: path.resolve(jsDir, 'src'),
    entry: entry,
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loaders: _.compact([
          isProduction() ? null : 'react-hot',
          'babel'
        ])
      }]
    },
    output: {
      filename: isProduction() ? '[name]-[hash].js' : '[name].js'
    },
    plugins: [
      new ManifestPlugin({
        fileName: 'manifest.json'
      })
    ].concat(getPlugins())
  }, baseConfig);

}

// Generates the configurat for data-lens
// Adds angular configuration
function generateDataLensConfig() {
  var angularDir = path.resolve(projectRootDir, 'public/javascripts/angular');
  var templateDir = path.resolve(projectRootDir, 'public/angular_templates');
  var srcDir = path.resolve(angularDir, 'src');

  var entries = getEntriesInDir(srcDir);

  console.log('Building datalens entrypoints: ', entries);

  var entry = getEntryObjectFromArray(
    entries.map(function(entryPoint) { return [entryPoint, './' + entryPoint]; })
  );

  return _.defaultsDeep({
    context: srcDir,
    entry: entry,
    externals: datalensWebpackExternals,
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loaders: [
            'ng-annotate',
            'babel'
          ]
        },
        {
          test: /\.html$/,
          exclude: /(node_modules|bower_components)/,
          loaders: [
            'ngtemplate?relativeTo=' + templateDir,
            'html'
          ]
        },
        {
          test: /modernizr\.js$/,
          loader: 'imports?this=>window'
        }
      ]
    },
    output: {
      filename: isProduction() ? 'angular/[name]-[hash].js' : 'angular/[name].js'
    },
    plugins: [
      new ManifestPlugin({
        fileName: 'data-lens-manifest.json'
      })
    ].concat(getPlugins()),
    resolve: {
      alias: {
        'angular_templates': templateDir,
        plugins: path.resolve(projectRootDir, 'public/javascripts/plugins')
      }
    }
  }, baseConfig);

}

// Export the bundle configurations to build
module.exports = [
  generateOldUxConfig(),
  generateDataLensConfig()
];
