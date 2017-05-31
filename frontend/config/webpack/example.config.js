/* eslint-env node */

// This is a sample webpack config - clone it to add a new project.
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/example'), // UPDATE
  entry: './main',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders([
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
      // Additional loaders may go here
    ])
  },
  resolve: common.getStandardResolve([ 'public/javascripts/example' ]), // UPDATE
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
