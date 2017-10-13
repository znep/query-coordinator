/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/adminActivityFeed'),
  entry: common.withHotModuleEntries({'main': './main.js'}),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminActivityFeed/.eslintrc.json'),
  module: {
    loaders: common.getStandardLoaders(
      [],
      {
        substituteStyleLoaders: [
          {
            test: /\.scss|\.css$/,
            loader: 'style-loader!css-loader!autoprefixer-loader!sass-loader'
          }
        ]
      }
    )
  },
  resolve: _.extend(
    common.getStandardResolve([ 'public/javascripts/adminActivityFeed' ])
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
