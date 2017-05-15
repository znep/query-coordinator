var AssetsPlugin = require('assets-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    'test': './spec/scripts'
  },
  devtool: 'inline-source-map',
  watch: true,
  plugins: [
    new AssetsPlugin()
  ]
};
