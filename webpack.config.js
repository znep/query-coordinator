var path = require('path');

module.exports = {
  context: __dirname,
  entry: './src/index.js',
  externals: {
    'jquery': 'jQuery',
    'lodash': '_'
  },
  output: {
    path: __dirname + '/dist',
    filename: 'socrata.utils.js',
    libraryTarget: 'umd',
    library: ['socrata', 'utils']
  },
  resolve: {
    alias: {
      'socrata-utils': path.resolve('./src/utils.js')
    },
    modulesDirectories: ['node_modules', 'bower_components']
  },
  devtool: 'cheap-source-map'
};
