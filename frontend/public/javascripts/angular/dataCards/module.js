const angular = require('angular');
require('rx-angular'); // Has side effect of registering the 'rx' angular module

require('../common/values.js');

var dependencies = [
  require('angular-ui-router'),
  require('angular-elastic'),
  require('angular-sanitize'),
  'rx',
  'socrataCommon.values'
];

// Create the dataCards module
angular.module('dataCards', dependencies);

angular.module('dataCards').

  // Controllers
  controller('CardsViewController', require('./controllers/pages/CardsViewController.js')).
  controller('ChoroplethController', require('./controllers/ChoroplethController.js')).
  controller('ColumnChartController', require('./controllers/ColumnChartController.js')).
  controller('DistributionChartController', require('./controllers/DistributionChartController.js')).
  controller('FeatureMapController', require('./controllers/FeatureMapController.js')).
  controller('HistogramController', require('./controllers/HistogramController.js')).
  controller('ManageLensDialogController', require('./controllers/ManageLensDialogController.js')).
  controller('ManageLensDialogOwnershipController', require('./controllers/ManageLensDialogOwnershipController.js')).
  controller('ManageLensDialogProvenanceController', require('./controllers/ManageLensDialogProvenanceController.js')).
  controller('ManageLensDialogSharingController', require('./controllers/ManageLensDialogSharingController.js')).
  controller('ManageLensDialogVisibilityController', require('./controllers/ManageLensDialogVisibilityController.js')).
  controller('SingleCardViewController', require('./controllers/pages/SingleCardViewController.js')).
  controller('TableCardController', require('./controllers/TableCardController.js')).
  controller('TestPageController', require('./controllers/pages/TestPageController.js')).
  controller('TimelineChartController', require('./controllers/TimelineChartController.js')).
  controller('VisualizationAddController', require('./controllers/pages/VisualizationAddController.js')).

  directive('addCardDialog', require('./directives/addCardDialog.js')).
  directive('animateTo', require('./directives/animateTo.js')).
  directive('apiExplorer', require('./directives/apiExplorer.js')).
  directive('axisRescalingToggle', require('./directives/axisRescalingToggle.js')).
  directive('card', require('./directives/card.js')).
  directive('cardAggregationSelector', require('./directives/cardAggregationSelector.js')).
  directive('cardLayout', require('./directives/cardLayout.js')).
  directive('cardTitle', require('./directives/cardTitle.js')).
  directive('choropleth', require('./directives/choropleth.js')).
  directive('classicVisualizationPreviewer', require('./directives/classicVisualizationPreviewer.js')).
  directive('clearableInput', require('./directives/clearableInput.js')).
  directive('columnAndVisualizationSelector', require('./directives/columnAndVisualizationSelector.js')).
  directive('columnChart', require('./directives/columnChart.js')).
  directive('customizeBar', require('./directives/customizeBar.js')).
  directive('customizeCardDialog', require('./directives/customizeCardDialog.js')).
  directive('disableNewline', require('./directives/disableNewline.js')).
  directive('distributionChart', require('./directives/distributionChart.js')).
  directive('exportMenu', require('./directives/exportMenu.js')).
  directive('featureMap', require('./directives/featureMap.js')).
  directive('histogram', require('./directives/histogram.js')).
  directive('infoPane', require('./directives/infoPane.js')).
  directive('invalidCard', require('./directives/invalidCard.js')).
  directive('intractableList', require('../common/directives/intractableList.js')).
  directive('lensType', require('./directives/lensType.js')).
  directive('loadSpinner', require('../common/directives/loadSpinner.js')).
  directive('manageLensDialog', require('./directives/manageLensDialog.js')).
  directive('mobileWarningDialog', require('./directives/mobileWarningDialog.js')).
  directive('modalDialog', require('./directives/modalDialog.js')).
  directive('multilineEllipsis', require('./directives/multilineEllipsis.js')).
  directive('newShareDialog', require('./directives/newShareDialog.js')).
  directive('pageHeader', require('../common/directives/pageHeader.js')).
  directive('quickFilterBar', require('./directives/quickFilterBar.js')).
  directive('removeAllCards', require('./directives/removeAllCards.js')).
  directive('revertButton', require('./directives/revertButton.js')).
  directive('richTextEditor', require('../common/directives/richTextEditor.js')).
  directive('saveAs', require('./directives/save-as.js')).
  directive('saveButton', require('./directives/saveButton.js')).
  directive('searchCard', require('./directives/searchCard.js')).
  directive('selectionLabel', require('./directives/selection-label.js')).
  directive('socSelect', require('./directives/socSelect.js')).
  directive('socOption', require('./directives/socOption.js')).
  directive('suggestionToolPanel', require('./directives/suggestionToolPanel.js')).
  directive('tableCard', require('./directives/tableCard.js')).
  directive('timelineChart', require('./directives/timelineChart.js')).
  directive('visualizationTypeSelector', require('./directives/visualizationTypeSelector.js')).
  directive('withSpacer', require('./directives/withSpacer.js')).
  directive('spinner', require('./directives/spinner.js')).

  // Filters
  filter('ellipsify', require('./filters/ellipsify.js')).
  filter('I18n', require('./filters/i18n.js')).
  filter('ifElse', require('../common/filters/ifElse.js')).
  filter('localizedLink', require('./filters/localizedLink.js')).
  filter('pageLimitTo', require('../common/filters/pageLimitTo.js')).
  filter('pluralize', require('./filters/pluralize.js')).
  filter('saveStatusText', require('./filters/saveStatusText.js')).

  // Services
  service('Analytics', require('../common/services/analytics.js')).
  factory('CardDataService', require('./services/data/CardDataService.js')).
  factory('CardVisualizationChoroplethHelpers', require('./services/CardVisualizationChoroplethHelpers.js')).
  factory('ColumnChartService', require('./services/ColumnChartService.js')).
  factory('Constants', require('./services/Constants.js')).
  factory('DatasetColumnsService', require('./services/DatasetColumnsService.js')).
  factory('DataTypeFormatService', require('./services/DataTypeFormatService.js')).
  factory('DateHelpers', () => require('common/visualizations/helpers/DateHelpers.js')).
  factory('DeveloperOverrides', require('./services/DeveloperOverrides.js')).
  factory('DeviceService', require('../common/services/DeviceService.js')).
  factory('FeatureMapService', require('./services/FeatureMapService.js')).
  factory('FlyoutService', require('./services/FlyoutService.js')).
  factory('HistogramService', require('./services/HistogramService.js')).
  factory('HistogramVisualizationService', require('./services/HistogramVisualizationService.js')).
  factory('http', require('../common/services/http.js')).
  service('I18n', require('./services/I18n.js')).
  factory('JJV', require('./services/JJV.js')).
  service('LeafletHelpersService', require('../common/services/LeafletHelpersService.js')).
  service('LeafletVisualizationHelpersService', require('./services/LeafletVisualizationHelpersService.js')).
  service('MixpanelService', require('./services/MixpanelService.js')).
  service('PageDataService', require('./services/data/PageDataService.js')).
  service('PageHelpersService', require('./services/PageHelpersService.js')).
  factory('PluralizeService', require('../common/services/PluralizeService.js')).
  factory('PolaroidService', require('./services/PolaroidService.js')).
  factory('RequestId', require('../common/services/requestId.js')).
  constant('Routes', require('./services/Routes.js')).
  constant('ServerConfig', require('../common/services/ServerConfig.js')).
  factory('SoqlHelpers', require('./services/SoqlHelpers.js')).
  factory('SortedTileLayout', require('./services/SortedTileLayout.js')).
  factory('SpatialLensService', require('./services/SpatialLensService.js')).
  factory('SquireSource', require('../common/services/SquireSourceService.js')).
  service('SuggestionService', require('./services/SuggestionService.js')).
  factory('TimelineChartService', require('./services/TimelineChartService.js')).
  service('UserSearchService', require('../common/services/UserSearch.js')).
  service('UserSessionService', require('../common/services/UserSession.js')).
  service('VectorTileDataService', require('./services/data/VectorTileDataService.js')).
  service('VIFExportService', require('./services/VIFExportService.js')).
  factory('WindowOperations', require('../common/services/WindowOperations.js')).
  factory('WindowState', require('./services/WindowState.js')).

  // Models
  factory('Class', require('../common/services/Class.js')).
  factory('Model', require('./models/Model.js')).
  factory('ModelHelper', require('./services/ModelHelper.js')).
  factory('Schemas', require('./services/Schemas.js')).
  factory('SchemaDefinitions', require('./services/SchemaDefinitions.js')).
  factory('Page', require('./models/Page.js')).
  factory('Dataset', require('./models/Dataset.js')).
  factory('Filter', require('./models/Filter.js')).
  factory('CardOptions', require('./models/CardOptions.js')).
  factory('Card', require('./models/Card.js'));

// TODO these could probably be cleaned up.
angular.module('rx').
  config(function($provide) {
    $provide.decorator('rx', ['$delegate', require('../common/decorators/safeApply.js')]);
  });

angular.module('dataCards').
  config(function($provide) {
    $provide.decorator('$rootScope', ['$delegate', '$log', 'rx',
      require('../common/decorators/ScopeRxExtensions.js')
    ]);
  });

module.exports = angular.module('dataCards');
