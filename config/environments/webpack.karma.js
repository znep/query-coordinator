var AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  entry: {
    'test': './spec/scripts'
  },
  output: {
    filename: '[name].[hash].js',
    path: 'public/js'
  },
  devtool: 'cheap-module-inline-source-map',
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
