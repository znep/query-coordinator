(function() {
  'use strict';

  var socrata = window.socrata;
  var utils = socrata.utils;

  function sendVisualizationToEnclosingWindow(visualizationData, visualizationType, originalUid) {

    // Trigger function attached to the iframe element in the parent
    if (_.isNull(window.frameElement)) {
      throw new Error('Page expects to be in an iframe, passing information to the parent window.');
    } else if (_.isFunction(window.frameElement.onVisualizationSelected)) {
      window.frameElement.onVisualizationSelected(visualizationData, visualizationType, originalUid);
    } else {
      throw new Error('Cannot find onVisualizationSelected on the iframe.');
    }
  }

  function VisualizationAddController(
    $scope,
    $rootScope,
    $log,
    DatasetColumnsService,
    dataset,
    WindowState,
    Page,
    defaultColumn,
    defaultRelatedVisualizationUid
    ) {

    /*************************
    * General metadata stuff *
    *************************/

    // Cards always expect to have a page, too painful to remove for now
    var pageBlob = {
      'cards': [],
      'datasetId': dataset.id
    };

    var blankPage = new Page(pageBlob, dataset);

    // Coerce the defaults to either valid values or null.
    defaultRelatedVisualizationUid = _.any(
      window.relatedVisualizations,
      'originalUid',
      defaultRelatedVisualizationUid) ? defaultRelatedVisualizationUid : null;

    defaultColumn = dataset.getCurrentValue('columns')[defaultColumn] ? defaultColumn : null;

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

        sendVisualizationToEnclosingWindow(visualization.data.sourceVif, 'vif', visualization.originalUid);
      } else if (visualization.format === 'classic') {
        // Unlike VIF, classic visualization requires originalUid.
        utils.assertHasProperty(visualization, 'originalUid');
        utils.assertIsOneOfTypes(visualization.originalUid, 'string');

        $scope.addCardSelectedColumnFieldName = null;
        $scope.classicVisualization = visualization;
        sendVisualizationToEnclosingWindow(visualization.data, 'classic', visualization.originalUid);
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
      sendVisualizationToEnclosingWindow(vif, 'vif', null);
    });

    // Apply the defaults, if any. defaultRelatedVisualizationUid is
    // highest priority (i.e. we only apply defaultColumn if no
    // defaultRelatedVisualizationUid is present).
    if (defaultRelatedVisualizationUid) {
      $scope.$emit(
        'related-visualization-selected',
        _.find(window.relatedVisualizations, 'originalUid', defaultRelatedVisualizationUid)
      );
    } else if (defaultColumn) {
      // I'm... so sorry about this. There's an odd timing issue in socSelect
      // (used in columnAndVisualizationSelector) that manifests as the column
      // dropdown not taking the value of defaultColumn (but the rest of the
      // UI reflects a selection of defaultColumn).
      // I can't figure out a safe way of fixing this without seriously endangering
      // the already-fragile socSelect. So I'm sidestepping the issue with setTimeout.
      // Computers!
      setTimeout(function() {
        $scope.addCardSelectedColumnFieldName = defaultColumn;
        $scope.$apply();
      });
    }
  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
