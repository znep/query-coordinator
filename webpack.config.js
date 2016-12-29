var fs = require('fs');
var path = require('path');

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
      modulesDirectories: [ 'node_modules' ]
    }
  },
  {
    context: __dirname,
    entry: ['whatwg-fetch', './src/index.js'],
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
      path: __dirname + '/dist',
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
  }
];
