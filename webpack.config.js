var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var distPath = __dirname + '/dist'

var libraryVersionPlugin = new webpack.DefinePlugin({
  LIBRARY_VERSION: JSON.stringify(require('./package.json').version)
});

module.exports = [
  {
    context: __dirname,
    entry: './examples/index.js',
    output: {
      path: __dirname + '/examples',
      filename: 'vendor.js'
    },
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            fs.realpathSync(path.resolve('node_modules/socrata-components'))
          ]
        }
      ],
      loaders: [
        {
          loader: 'imports-loader',
          test: require.resolve('dotdotdot'),
          query: { 'jQuery': 'jquery' }
        }
      ]
    },
    resolveLoader: {
      modulesDirectories: [ fs.realpathSync('node_modules') ]
    },
    resolve: {
      alias: {
        'react': path.resolve('./node_modules/react')
      },
      modulesDirectories: [ 'node_modules' ]
    }
  },

  {
    context: __dirname,
    entry: ['whatwg-fetch', './src/index.js'],
    plugins: [ libraryVersionPlugin ],
    externals: {
      'jquery': true,
      'socrata-utils': true,
      'd3': true,
      'lodash': true,
      'moment': true,
      'leaflet': true,
      'socrata-components': true,
      'react': true,
      'react-dom': true,
      'react-redux': true,
      'redux': true,
      'redux-logger': true,
      'redux-thunk': true
    },
    output: {
      path: distPath,
      filename: 'socrata-visualizations.js',
      libraryTarget: 'umd',
      library: ['socrata', 'visualizations']
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [ path.resolve('src'), path.resolve('karma') ]
        }
      ]
    },
    resolve: {
      modulesDirectories: [ 'node_modules' ]
    },
    devtool: 'source-map'
  },

  {
    context: __dirname,
    entry: ['whatwg-fetch', './src/embed/index.js'],
    plugins: [ libraryVersionPlugin ],
    output: {
      path: distPath,
      filename: 'socrata-visualizations-embed.js',
      libraryTarget: 'umd',
      library: ['socrata', 'visualizations']
    },
    module: {
      loaders: [
        {
          // Prevent lodash from putting itself on window.
          // See: https://github.com/lodash/lodash/issues/2671
          test: /node_modules\/lodash/,
          loader: "imports?define=>undefined"
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [ path.resolve('src'), path.resolve('karma') ]
        },
        {
          loader: 'imports-loader',
          test: /dotdotdot/,
          query: { 'jQuery': 'jquery' }
        },
        {
          test: /\.s?css$/,
          // Process styles but don't inline images. We don't use them.
          loader: 'style-loader!css-loader?url=false!sass-loader'
        }
      ]
    },
    resolve: {
      modulesDirectories: [ 'node_modules' ],
      alias: {
        'react': path.resolve('node_modules/react'),
        'react-dom': path.resolve('node_modules/react-dom')
      }
    },
    devtool: 'source-map'
  },
  {
    context: __dirname,
    entry: './src/embed/loader.js',
    output: {
      path: distPath,
      filename: 'socrata-visualizations-loader.js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [ path.resolve('src') ]
        }
      ]
    }
  }

];
