const path = require('path');
const root = path.resolve(__dirname, '..');

module.exports = {
  context: root,
  devtool: 'source-map',
  entry: `${root}/pages/javascripts/vendor.js`,
  output: {
    path: `${root}/dist/js`,
    filename: 'vendor.js',
    libraryTarget: 'umd',
    library: 'vendor'
  },
  resolve: {
    modulesDirectories: ['node_modules']
  },
  module: {
    loaders: [
      {
        loader: 'babel?cacheDirectory',
        test: /\.js$/,
        exclude: /node_modules/
      },
      {
        loader: 'imports-loader',
        test: require.resolve('dotdotdot'),
        query: { 'jQuery': 'jquery' }
      }
    ]
  },
  plugins: []
};
