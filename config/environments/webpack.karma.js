var AssetsPlugin = require('assets-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    'test': './spec/scripts'
  },
  resolve: {
    root: [
      path.resolve(__dirname, '../../app/assets/javascripts')
    ]
  },
  devtool: 'eval',
  watch: true,
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        query: {
          plugins: ['babel-plugin-rewire'],
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new AssetsPlugin()
  ]
};
