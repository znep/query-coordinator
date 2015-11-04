var Rewire = require('rewire-webpack')
module.exports = {
  context: __dirname,
  entry: './src/index.js',
  externals: {
    'jquery': 'jQuery',
    'socrata-utils': 'socrata.utils',
    'd3': 'd3',
    'lodash': '_',
    'moment': 'moment',
    'simple-statistics': 'ss',
    'chroma': 'chroma',
  },
  output: {
    path: __dirname + '/dist',
    filename: 'socrata-visualizations.js',
    libraryTarget: 'var',
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
