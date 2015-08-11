(function() {
  'use strict';

  function VisualizationAddController($scope, $rootScope, $log, dataset, WindowState, Page) {

    /*************************
    * General metadata stuff *
    *************************/

    // Cards always expect to have a page, too painful to remove for now
    var pageBlob = {
      'cards': [],
      'datasetId': dataset.id
    };

    $scope.page = new Page(pageBlob, dataset);
    $scope.dataset = dataset;


    /*************************
    * Trigger events for parent page *
    *************************/
    $scope.$on('card-model-selected', function(event, selectedCard) {
      var eventPayload = selectedCard ? selectedCard.serialize() : null;

      // Trigger function attached to the iframe element in the parent
      if (_.isNull(window.frameElement)) {

        throw 'Page expects to be in an iframe, passing information to the parent window.';
      } else if (_.isFunction(window.frameElement.onVisualizationSelected)) {

        window.frameElement.onVisualizationSelected(eventPayload);
      } else {

        throw 'Cannot find onVisualizationSelected on the iframe.';
      }

    });

    /******************************
    * Build Column Information
    *
    * Responsible for:
    * - Adding field names to columns
    * - Split columns into visualizable and non-visualizable groups
    * - Filtering out system columns
    * - Sort by field name
    * DUPLICATE FUNCTIONALITY FROM: CARDSVIEWCONTROLLER.JS
    *******************************/

    var datasetColumnsObservable = dataset.observe('columns');

    var datasetColumns = Rx.Observable.combineLatest(
      datasetColumnsObservable,
      function(columns) {

        var sortedColumns = _.pairs(columns).
          map(function(columnPair) {
            return {
              fieldName: columnPair[0],
              columnInfo: columnPair[1]
            };
          }).
          filter(function(columnPair) {

            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
              columnPair.columnInfo.physicalDatatype !== '*';
          }).
          sort(function(a, b) {
            // TODO: Don't we want to sort by column human name?
            return a.fieldName > b.fieldName;
          });


        var availableColumns = [];
        var visualizationUnsupportedColumns = [];

        _.forEach(sortedColumns, function(column) {

          if (column.defaultCardType === 'invalid') {
            visualizationUnsupportedColumns.push(column.fieldName);

            // CORE-4645: Do not allow subColumns to be available as cards to add
          } else if (!column.columnInfo.isSubcolumn) {
            availableColumns.push(column.fieldName);
          }
        });

        return {
          available: availableColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };
      }
    );

    $scope.$bindObservable('datasetColumns', datasetColumns);

  }

  angular.
    module('dataCards.controllers').
      controller('VisualizationAddController', VisualizationAddController);

})();
