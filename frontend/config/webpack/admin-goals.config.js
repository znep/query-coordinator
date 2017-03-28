/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/adminGoals'),
  entry: './main.js',
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/adminGoals/.eslintrc.json'),
  module: {
    loaders: [
      common.getBabelLoader(),
      {
        test: /\.scss|\.css$/,
        loader: 'style!css!autoprefixer-loader!sass'
      },
      {
        test: /\.svg/,
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: _.extend(
    {
      alias: {
        'styleguide': 'socrata-components/dist/js/styleguide.js'
      }
    },
    common.getStandardResolve()
  ),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
