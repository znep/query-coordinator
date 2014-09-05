angular.module('dataCards.directives').directive('cardVisualizationTable', function(AngularRxExtensions, CardDataService, SortedTileLayout) {
  "use strict";

  var unsortable = ['geo_entity'];

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationTable.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');
      var whereClause = $scope.observe('whereClause');
      var dataRequests = new Rx.Subject();
      var dataResponses = new Rx.Subject();
      var rowCountSequence = new Rx.Subject();
      var filteredRowCountSequence = new Rx.Subject();

      // TODO: Let's figure out how to functional-reactify this request as well.
      $scope.getRows = function() {
        var args = [$scope.model.page.getCurrentValue('dataset').id].concat(
          Array.prototype.slice.call(arguments));
        return CardDataService.getRows.apply(CardDataService, args);
      };

      var columnDetails = dataset.observeOnLatest('columns').map(function(columns) {
        var filteredColumns = {};
        _.each(columns, function(column, name) {
          // Filter out names like :Computed_banana and *
          if (name[0].match(/[a-zA-Z0-9]/g)) {
            // Check if sortable
            column.sortable = !_.contains(unsortable, column.physicalDatatype);
            filteredColumns[name] = column;
          }
        });
        return filteredColumns;
      });

      // Keep track of the number of requests that have been made and the number of
      // responses that have come back.
      // .scan() is necessary because the usual aggregation suspect reduce actually
      // will not execute over a sequence until it has been completed; scan is happy
      // to operate on active sequences.
      var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
      var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });

      // If the number of requests is greater than the number of responses, we have
      // a request in progress and we should display the spinner.
      $scope.bindObservable('busy',
        Rx.Observable.combineLatest(
          dataRequestCount,
          dataResponseCount,
          function(requests, responses) {
            return requests === 0 || (requests > responses);
          }));

      var rowCount = dataset.map(
        function(dataset) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getRowCount(dataset.id);
          dataPromise.then(
            function(res) {
              // Ok
              rowCountSequence.onNext(dataPromise);
              dataResponses.onNext(1);
            },
            function(err) {
              // Do nothing
            });
          return Rx.Observable.fromPromise(dataPromise);
        });

      var filteredRowCount = Rx.Observable.combineLatest(
        dataset,
        whereClause,
        function(dataset, whereClause) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getRowCount(dataset.id, whereClause);
          dataPromise.then(
            function(res) {
              // Ok
              filteredRowCountSequence.onNext(dataPromise);
              dataResponses.onNext(1);
            },
            function(err) {
              // Do nothing
            });
          return Rx.Observable.fromPromise(dataPromise);
        });

      // The default sort is on the first card in the page layout.
      var layout = new SortedTileLayout();
      var defaultSortColumnName = model.pluck('page').observeOnLatest('cards').map(function(cards) {
        if (_.isEmpty(cards)) return null;
        var sizedCards = _.compact(_.map(cards, function(card) {
          // Sorting on the table card doesn't make any sense.
          if (card.fieldName === '*') return null;
          return {
            cardSize: card.getCurrentValue('cardSize'),
            model: card
          };
        }));
        var computedLayout = layout.doLayout(sizedCards);
        var sortedCardSizes = _.keys(computedLayout).sort();
        var cardsInFirstSize = _.flatten(computedLayout[_.first(sortedCardSizes)]);
        return _.first(cardsInFirstSize).model.fieldName;
      });

      $scope.bindObservable('whereClause', whereClause);
      $scope.bindObservable('rowCount', rowCount.switchLatest());
      $scope.bindObservable('filteredRowCount', filteredRowCount.switchLatest());
      $scope.bindObservable('columnDetails', columnDetails);
      $scope.bindObservable('expanded', model.observeOnLatest('expanded'));
      $scope.bindObservable('defaultSortColumnName', defaultSortColumnName);

      $scope.$on('table:expand-clicked', function() {
        $scope.model.page.toggleExpanded($scope.model);
      });

    }
  };

});
