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
  devtool: 'inline-source-map',
  watch: true,
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        query: {
          plugins: ['babel-plugin-rewire', 'transform-object-rest-spread'],
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  plugins: [
    new AssetsPlugin()
  ]
};
