/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

var plugins = common.plugins.concat(common.getManifestPlugin(identifier));
if (!common.isProduction) {
  plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = _.defaultsDeep({
  context: path.resolve(common.root, 'public/javascripts/datasetManagementUI'),
  entry: common.getHotModuleEntries().concat([
    './main'
  ]),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/datasetManagementUI/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(common.root, 'public/javascripts'),
          path.resolve(common.root, 'node_modules/socrata-components/common')
        ],
        loaders: (common.isProduction ? ['babel'] : ['react-hot', 'babel'])
      },
      {
        test: /\.global.scss$/,
        include: [
          path.resolve(common.root, 'public/javascripts/datasetManagementUI')
        ],
        loader: 'style?sourceMap!css!postcss!sass'
      },
      {
        test: /^((?!\.global).)*(scss|css)$/,
        loader: 'style?sourceMap!css?modules&localIdentName=[name]___[local]---[hash:base64:5]&importLoaders=1!postcss!sass'
      }
    ]
  },
  resolve: {
    root: [
      path.resolve(common.root, 'public/javascripts/datasetManagementUI')
    ]
  },
  plugins: plugins,
  postcss: function() {
    return [
      require('autoprefixer')
    ];
  }
}, require('./base'));
