var AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  entry: {
    'test': './spec/scripts'
  },
  output: {
    filename: '[name].[hash].js',
    path: 'public/js'
  },
  plugins: [
    new AssetsPlugin()
  ]
};
