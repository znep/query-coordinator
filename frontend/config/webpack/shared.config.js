/* eslint-env node */
var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');

var webpackHelpers = require('./helpers');
var identifier = path.basename(__filename, '.config.js');
// Meaning of a "minChunk" from https://webpack.js.org/plugins/commons-chunk-plugin/
// The minimum number of chunks which need to contain a module before it's moved into the commons chunk.
var COMMONS_CHUNK_MIN_CHUNKS = 5;

module.exports = _.defaultsDeep({
  context: path.resolve(webpackHelpers.frontendRoot, 'public/javascripts'),
  entry: webpackHelpers.withHotModuleEntries({
    'adminActivityFeed': 'adminActivityFeed/main.js',
    'adminActivityFeedSoql': 'adminActivityFeedSoql/main.js',
    'adminConnector': 'src/screens/admin-connector.js',
    'adminEditConnector': 'src/screens/admin-edit-connector.js',
    'adminGeoregions': 'src/screens/admin-georegions-screen.js',
    'adminGoals': 'adminGoals/main.js',
    'adminNewConnector': 'src/screens/admin-new-connector.js',
    'adminRoles': 'adminRoles/main.js',
    'adminUsersV2': 'adminUsersV2/main.js',
    'approvals': 'approvals/main.js',
    'authentication': 'authentication/index.js',
    'catalogLandingPageMain': 'catalogLandingPage/main.js',
    'catalogLandingPageManage': 'catalogLandingPage/manage.js',
    'componentExamplePagesMain': 'demos/components/main.js',
    'componentExamplePagesButton': 'demos/components/button.js',
    'datasetLandingPageMain': 'datasetLandingPage/main.js',
    'datasetLandingPageColocate': 'datasetLandingPage/colocate.js',
    'datasetManagementUI': 'datasetManagementUI/main.js',
    'internalAssetManager': 'internal_asset_manager/main.js',
    'opMeasure': 'opMeasure/main.js',
    'siteAppearance': 'siteAppearance/main.js',
    'siteWide': path.resolve(webpackHelpers.commonRoot, 'site_wide.js'),
    'userProfile': 'userProfile/main.js',
    'visualizationCanvas': 'visualizationCanvas/main.js',
    'visualizationExamplePages': 'demos/visualizations/main.js'
  }),
  output: webpackHelpers.getOutput(identifier),
  module: {
    loaders: webpackHelpers.getStandardLoaders()
  },
  resolve: _.extend(
    {
      alias: {
        'dotdotdot': 'dotdotdot/src/js/jquery.dotdotdot.min.js',
        'jquery': 'jQuery'
      }
    },
    webpackHelpers.getStandardResolve()
  ),
  externals: {
    jquery: 'jQuery'
  },
  plugins: [
    // Until Webpack gets upgraded past v1.x, we'll be using a very outdated version / syntax for
    // the CommonsChunkPlugin. The arguments here are: CommonsChunkPlugin(<name>, <filename>, <minChunks>)
    // the meanings of <name>, <filename> and <minChunks> have not changed so you can refer to
    // https://webpack.js.org/plugins/commons-chunk-plugin/ for more info
    new webpack.optimize.CommonsChunkPlugin('common', 'shared/common.js', COMMONS_CHUNK_MIN_CHUNKS)
  ].concat(
    webpackHelpers.plugins,
    webpackHelpers.getManifestPlugin(identifier)
  )
}, require('./base'));
