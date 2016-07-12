var path = require('path');
var Rewire = require('rewire-webpack');

module.exports = [
  {
    context: __dirname,
    entry: './examples/index.js',
    output: {
      path: __dirname + '/examples',
      filename: 'vendor.js'
    },
    resolve: {
      modulesDirectories: ['node_modules'],
      alias: {
        'socrata-utils': path.join(__dirname, '.', 'node_modules/socrata-utils/dist/socrata.utils.js'),
        'jquery': path.join(__dirname, '.', 'node_modules/jquery/dist/jquery.js')
      }
    }
  },
  {
    context: __dirname,
    entry: './src/index.js',
    externals: {
      'jquery': true,
      'socrata-utils': true,
      'd3': true,
      'lodash': true,
      'moment': true,
      'leaflet': true,
      'socrata-styleguide': true,
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
    plugins: [
      new Rewire()
    ],
    devtool: 'source-map'
  }
];
