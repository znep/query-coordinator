var path = require('path');

module.exports = [
  {
    context: __dirname,
    entry: './examples/index.js',
    output: {
      path: __dirname + '/examples',
      filename: 'vendor.js'
    },
    resolve: {
      modulesDirectories: ['node_modules']
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
      'react-dom': true
    },
    output: {
      path: __dirname + '/dist',
      filename: 'socrata-visualizations.js',
      libraryTarget: 'umd',
      library: ['socrata', 'visualizations']
    },
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
      ]
    },
    resolve: {
      modulesDirectories: ['node_modules']
    },
    devtool: 'source-map'
  }
];
