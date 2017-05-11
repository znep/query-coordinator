var path = require('path');

module.exports = {
  entry: {
    admin: './app/assets/javascripts/admin',
    view: './app/assets/javascripts/view',
    editor: './app/assets/javascripts/editor',
    tile: './app/assets/javascripts/tile'
  },
  output: {
    filename: '[name].js',
    path: './public/js'
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
          plugins: ['transform-object-rest-spread']
        }
      },
      { loader: 'imports-loader', test: require.resolve('unidragger'), query: { 'define': '>false' } },
      { loader: 'imports-loader', test: require.resolve('jquery-sidebar'), query: { 'jQuery': 'jquery' } },
      { loader: 'expose?$!expose?jQuery', test: require.resolve('jquery')}
    ]
  },
  resolve: {
    alias: {
      'squire': path.resolve('.', 'node_modules/squire-rte/build/squire-raw.js')
    }
  }
};
