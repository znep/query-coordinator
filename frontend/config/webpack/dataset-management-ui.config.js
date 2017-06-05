/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

var plugins = common.plugins.concat(common.getManifestPlugin(identifier));

if (!common.isProduction) {
  // mock-fetch apparently thinks it should run in node and so includes the
  // node-fetch version of fetch in the bundle. It tries to require this module,
  // which causes the build error. Just stubbing it out here but working on a way
  // to not use node-fetch at all as we don't need it.
  plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\/iconv-loader$/, 'node-noop')
  );
}

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts/datasetManagementUI'),
  entry: common.withHotModuleEntries('./main'),
  output: common.getOutput(identifier),
  eslint: common.getEslintConfig('public/javascripts/datasetManagementUI/.eslintrc.json'),
  externals: {
    jquery: true
  },
  module: {
    loaders: common.getStandardLoaders([
      {
        test: /\.global.scss$/,
        include: [
          path.resolve(common.frontendRoot, 'public/javascripts/datasetManagementUI')
        ],
        loader: 'style?sourceMap!css!postcss!sass'
      },
      {
        test: /^((?!\.global).)*(scss|css)$/,
        loader: 'style?sourceMap!css?modules&localIdentName=[name]___[local]---[hash:base64:5]&importLoaders=1!postcss!sass'
      }
    ])
  },
  resolve: common.getStandardResolve([ 'public/javascripts/datasetManagementUI' ]),
  plugins: plugins,
  postcss: function() {
    return [require('autoprefixer')];
  }
}, require('./base'));
