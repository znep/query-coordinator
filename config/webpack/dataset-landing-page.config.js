/*eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/datasetLandingPage'),
  entry: './main',
  output: common.getOutput(identifier),
  resolve: {
    alias: {
      dotdotdot: 'dotdotdot/src/js/jquery.dotdotdot.min.js'
    }
  },
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
