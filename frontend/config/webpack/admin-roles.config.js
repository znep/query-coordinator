/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

const webpackConfig = _.defaultsDeep(
  {
    context: path.resolve(common.frontendRoot, 'public/javascripts/adminRoles'),
    entry: common.withHotModuleEntries({ main: './main' }),
    output: common.getOutput(identifier),
    eslint: common.getEslintConfig('public/javascripts/adminRoles/.eslintrc.json'),
    module: {
      loaders: common.getStandardLoaders()
    },
    resolve: _.assign(
      { alias: { styles: path.resolve(common.frontendRoot, 'app/styles') } },
      common.getStandardResolve(['public/javascripts/adminRoles'])
    ),
    plugins: common.plugins.concat(common.getManifestPlugin(identifier)),
    sassLoader: {
      includePaths: [path.resolve(common.frontendRoot, 'app/styles')]
    }
  },
  require('./base')
);
module.exports = webpackConfig;
