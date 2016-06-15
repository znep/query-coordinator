/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/datasetLandingPage'),
  entry: './main',
  output: common.getOutput(identifier),
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: path.resolve(common.root, 'public/javascripts'),
        loader: 'babel'
      }
    ]
  },
  resolve: {
    alias: {
      'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
      'socrata-utils': 'socrata-utils/dist/socrata.utils.js',
      'socrata.utils': 'socrata-utils/dist/socrata.utils.js',
      '_': path.resolve(common.root, 'node_modules/lodash'),
      'jQuery': path.resolve(common.root, 'node_modules/jquery/dist/jquery.js'),
      'jquery': path.resolve(common.root, 'node_modules/jquery/dist/jquery.js'),
      'L': 'leaflet',
      'react': path.resolve(common.root, 'node_modules/react'),
      'react-dom': path.resolve(common.root, 'node_modules/react-dom')
    },
    root: [
      path.resolve(common.root, 'public/javascripts/datasetLandingPage')
    ]
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
