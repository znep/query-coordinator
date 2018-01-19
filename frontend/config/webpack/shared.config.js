/* eslint-env node */
var _ = require('lodash');
var path = require('path');

var webpackHelpers = require('./helpers');
var identifier = path.basename(__filename, '.config.js');

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
    'gridViewSocrataVisualizations': 'grid_view_socrata_visualizations/main.js',
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
  plugins: webpackHelpers.plugins.concat(webpackHelpers.getManifestPlugin(identifier))
}, require('./base'));
