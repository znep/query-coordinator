var Rewire = require('rewire-webpack');
var path = require('path');

module.exports = {
  context: __dirname,
  entry: './src/index.js',
  externals: {
    'jquery': 'jQuery',
    'socrata-utils': {
      root: ['socrata', 'utils'],
      commonjs2: 'socrata.utils',
      commonjs: 'socrata.utils',
      amd: 'socrata.utils'
    },
    'd3': 'd3',
    'lodash': '_',
    'moment': 'moment'
  },
  output: {
    path: __dirname + '/dist',
    filename: 'socrata-visualizations.js',
    libraryTarget: 'umd',
    library: ['socrata', 'visualizations']
  },
  resolve: {
    modulesDirectories: ['node_modules', 'bower_components']
  },
  plugins: [
    new Rewire()
  ],
  devtool: 'cheap-source-map'
};
