(function() {
  'use strict';

  var socrata = window.socrata;
  var utils = socrata.utils;

  function getSupportedRelatedVisualizations(supportedVIFTypes) {
    // Injected via AngularController for the visualization_add action.
    var relatedVisualizations = window.relatedVisualizations;
    utils.assert(relatedVisualizations, 'relatedVisualizations was not injected by AngularController');

    return _.filter(relatedVisualizations, function(visualization) {
      utils.assertHasProperty(visualization, 'sourceVif.type');
      return _.contains(supportedVIFTypes, visualization.sourceVif.type);
    });
  }

  function sendVifToEnclosingWindow(vif) {

    // Trigger function attached to the iframe element in the parent
    if (_.isNull(window.frameElement)) {
      throw new Error('Page expects to be in an iframe, passing information to the parent window.');
    } else if (_.isFunction(window.frameElement.onVisualizationSelected)) {

      window.frameElement.onVisualizationSelected(vif);
    } else {

      throw new Error('Cannot find onVisualizationSelected on the iframe.');
    }

  }

  function VisualizationAddController($scope, $rootScope, $log, DatasetColumnsService, dataset, WindowState, Page) {

    /*************************
    * General metadata stuff *
    *************************/

    // Cards always expect to have a page, too painful to remove for now
    var pageBlob = {
      'cards': [],
      'datasetId': dataset.id
    };

    var blankPage = new Page(pageBlob, dataset);
    $scope.blankPage = blankPage;

    $scope.page = blankPage;
    $scope.dataset = dataset;

    $scope.$bindObservable(
      'whereClause',
      $scope.$observe('page').observeOnLatest('computedWhereClauseFragment')
    );

    $scope.$bindObservable('columnNameToReadableNameFn', DatasetColumnsService.getReadableColumnNameFn$($scope));
    $scope.addCardSelectedColumnFieldName = null;
    $scope.$bindObservable(
      'highlightedColumns',
      $scope.$observe('addCardSelectedColumnFieldName').
        map(function(fieldName) {
          return fieldName ? [ fieldName ] : [];
        })
    );

    // Right now we only support embedding a subset of visualization types.
    $scope.supportedCardTypes = ['column', 'feature', 'timeline'];
    $scope.supportedVIFTypes = ['columnChart', 'featureMap', 'timelineChart'];

    var cardTypesToVIFTypes = {};
    $scope.supportedCardTypes.forEach(function(cardType, index) {
      cardTypesToVIFTypes[cardType] = $scope.supportedVIFTypes[index];
    });

    $scope.relatedVisualizations = getSupportedRelatedVisualizations($scope.supportedVIFTypes);

    function generateVIF(selectedCard) {
      var metadata = dataset.serialize();
      var column = metadata.columns[selectedCard.fieldName];
      var type = _.first(_.intersection($scope.supportedCardTypes, column.availableCardTypes));

      return {
        'aggregation': {
          'field': null,
          'function': 'count'
        },
        'columnName': selectedCard.fieldName,
        'configuration': {
          'localization': {
            'UNIT_ONE': 'record',
            'UNIT_OTHER': 'records'
          }
        },
        'createdAt': (new Date()).toISOString(),
        'datasetUid': dataset.id,
        'description': column.description,
        'domain': metadata.domain,
        'filters': [],
        'format': {
          'type': 'visualization_interchange_format',
          'version': 1
        },
        'origin': {
          'type': 'data_lens_add_visualization_component',
          'url': 'https://{0}/view/{1}'.format(metadata.domain, dataset.id)
        },
        'title': column.name,
        'type': cardTypesToVIFTypes[type]
      };
    }

    // Emitted by relatedVisualizationSelector. This page metadata contains a
    // sourceVif property.
    $scope.$on('related-visualization-selected', function(event, pageMetadata) {
      utils.assertHasProperty(pageMetadata, 'sourceVif.type');

      $scope.page = new Page(pageMetadata, dataset);
      $scope.addCardSelectedColumnFieldName = pageMetadata.sourceVif.columnName;

      sendVifToEnclosingWindow(pageMetadata.sourceVif);
    });

    /*************************
    * Trigger events for parent page *
    *************************/
    // Possible: 'visualization-selected', arg = VIF? (or selectedCard?)
    $scope.$on('card-model-selected', function(event, selectedCard) {
      var vif = selectedCard ? generateVIF(selectedCard) : null;
      $scope.page = $scope.blankPage;
      sendVifToEnclosingWindow(vif);
    });
  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
