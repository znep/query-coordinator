var AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  entry: {
    'test': './spec/scripts'
  },
  devServer: {
    port: 3031,
    quiet: false,
    filename: '[name]',
    publicPath: '/stories/js',
    contentBase: 'public/js',
    https: true
  },
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: '[name].[hash].js',
    path: 'public/js'
  },
  plugins: [
    new AssetsPlugin()
  ]
}
