var webpack = require('webpack');
var AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  output: {
    filename: '[name].[hash].js',
    path: 'public/js'
  },
  plugins: [
    new AssetsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
}
