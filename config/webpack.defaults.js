var path = require('path');

module.exports = {
  entry: {
    admin: './app/assets/javascripts/admin',
    view: './app/assets/javascripts/view',
    editor: './app/assets/javascripts/editor',
    widget: './app/assets/javascripts/widget'
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
          presets: ['es2015']
        }
      },
      { loader: 'imports-loader', test: require.resolve('unidragger'), query: { 'define': '>false' } },
      { loader: 'imports-loader', test: require.resolve('jquery-sidebar'), query: { 'jQuery': 'jQuery' } },
      { loader: 'expose?$!expose?jQuery', test: require.resolve('jquery')}
    ]
  },
  resolve: {
    alias: {
      'airbrake': path.resolve('.', 'node_modules/airbrake-js/lib/client.js'),
      'd3': path.resolve('.', 'node_modules/d3/d3.js'),
      'jQuery': path.resolve('.', 'node_modules/jquery/dist/jquery.js'),
      'jQuery-sidebar': path.resolve('.', 'node_modules/jquery-sidebar/src/jquery.sidebar.js'),
      'L': path.resolve('.', 'node_modules/leaflet/dist/leaflet.js'),
      'socrata-utils': path.resolve('.', 'node_modules/socrata-utils/dist/socrata.utils.js'),
      'socrata.utils': path.resolve('.', 'node_modules/socrata-utils/dist/socrata.utils.js'),
      'socrata-visualizations': path.resolve('.', 'node_modules/socrata-visualizations/dist/socrata-visualizations.js'),
      'squire': path.resolve('.', 'node_modules/squire-rte/build/squire-raw.js'),
      'lodash': path.resolve('.', 'node_modules/lodash/index.js'),
      '_': path.resolve('.', 'node_modules/lodash/index.js'),
      'unipointer': path.resolve('.', 'node_modules/unipointer/unipointer.js'),
      'unidragger': path.resolve('.', 'node_modules/unidragger/unidragger.js')
    }
  }
};
