(function() {
  'use strict';

  var socrata = window.socrata;
  var utils = socrata.utils;

  function sendVisualizationToEnclosingWindow(visualizationData, visualizationType) {

    // Trigger function attached to the iframe element in the parent
    if (_.isNull(window.frameElement)) {
      throw new Error('Page expects to be in an iframe, passing information to the parent window.');
    } else if (_.isFunction(window.frameElement.onVisualizationSelected)) {
      window.frameElement.onVisualizationSelected(visualizationData, visualizationType);
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
        combineLatest($scope.$observe('classicVisualization'), function(fieldName, classicVisualization) {
          if (fieldName) {
            return [fieldName];
          } else if (classicVisualization) {
            return classicVisualization.columns;
          }
        })
    );

    // Right now we only support embedding a subset of visualization types.
    $scope.supportedCardTypes = ['column', 'feature', 'timeline'];
    $scope.supportedVIFTypes = ['columnChart', 'featureMap', 'timelineChart'];

    var cardTypesToVIFTypes = {};
    $scope.supportedCardTypes.forEach(function(cardType, index) {
      cardTypesToVIFTypes[cardType] = $scope.supportedVIFTypes[index];
    });

    $scope.relatedVisualizations = window.relatedVisualizations;

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
    $scope.$on('related-visualization-selected', function(event, visualization) {
      if (visualization.format === 'page_metadata') {
        utils.assertHasProperty(visualization, 'data.sourceVif.type');

        $scope.page = new Page(visualization.data, dataset);
        $scope.addCardSelectedColumnFieldName = visualization.data.sourceVif.columnName;
        $scope.classicVisualization = null;

        sendVisualizationToEnclosingWindow(visualization.data.sourceVif, 'vif');
      } else if (visualization.format === 'classic') {
        $scope.addCardSelectedColumnFieldName = null;
        $scope.classicVisualization = visualization;
        sendVisualizationToEnclosingWindow(visualization.data, 'classic');
      }
    });

    /*************************
    * Trigger events for parent page *
    *************************/
    // Possible: 'visualization-selected', arg = VIF? (or selectedCard?)
    $scope.$on('card-model-selected', function(event, selectedCard) {
      var vif = selectedCard ? generateVIF(selectedCard) : null;
      $scope.page = $scope.blankPage;
      $scope.classicVisualization = null;
      sendVisualizationToEnclosingWindow(vif, 'vif');
    });
  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
