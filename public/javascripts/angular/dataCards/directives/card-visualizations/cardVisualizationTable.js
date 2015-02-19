(function() {

  'use strict';

  var unsortable = ['geo_entity'];
  var validColumnRegex = new RegExp('^[\\d\\w_]{2}');

  function cardVisualizationTableDirectiveFactory(AngularRxExtensions, CardDataService, SortedTileLayout) {

    return {
      restrict: 'E',
      scope: { 'model': '=', 'whereClause': '=', 'showCount': '=?', 'firstColumn': '=?' },
      templateUrl: '/angular_templates/dataCards/cardVisualizationTable.html',
      link: function($scope, element, attrs) {

        AngularRxExtensions.install($scope);

        var model = $scope.observe('model');
        var dataset = model.observeOnLatest('page.dataset');
        var whereClause = $scope.observe('whereClause');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var rowCountSequence = new Rx.Subject();
        var filteredRowCountSequence = new Rx.Subject();

        $scope.$watch('showCount', function(newVal, oldVal, scope) {
          if (!angular.isDefined(newVal)){
            scope.showCount = true;
          }
        });

        // TODO: Let's figure out how to functional-reactify this request as well.
        $scope.getRows = function() {
          var args = [$scope.model.page.getCurrentValue('dataset').id].concat(
            Array.prototype.slice.call(arguments));
          return CardDataService.getRows.apply(CardDataService, args);
        };

        function isDisplayableColumn(column, fieldName) {
          return validColumnRegex.test(fieldName);
        }

        function removeSystemColumns(columns) {
          return _.pick(
            _.cloneDeep(columns),
            isDisplayableColumn
          );
        }

        function addExtraAttributesToColumns(columns) {
          return _.transform(columns, function(result, column, fieldName) {
            var newColumn = Object.create(column);
            newColumn.sortable = !_.contains(unsortable, column.physicalDatatype);
            // SIGH. I'd love to not do this, but we'd have to change a whole heap of table and
            // table test code to support that sort of idealism. The main issue is that table
            // expects its column information in a significant-order array.
            newColumn.fieldName = fieldName;

            result[fieldName] = newColumn;
          }, {});
        }

        var columnDetails = dataset.observeOnLatest('columns').
          map(removeSystemColumns).
          map(addExtraAttributesToColumns);

        var columnDetailsAsArray = columnDetails.
          map(_.toArray).
          combineLatest(
            $scope.observe('firstColumn'),
            function(asArray, firstColumnFieldName) {
            if ($.isPresent(firstColumnFieldName)) {
              var columnIndex = _.findIndex(asArray, function(column) {
                return column.fieldName === firstColumnFieldName;
              });
              if (columnIndex >= 0) {
                var column = asArray.splice(columnIndex, 1)[0];
                asArray.splice(0, 0, column);
              }
            }
            return asArray;
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
        var defaultSortColumnName = model.observeOnLatest('page.cards').map(function(cards) {
          var sizedCards = _.compact(_.map(cards, function(card) {
            // Sorting on the table card doesn't make any sense; computed and
            // system columns are not included either.
            if (card.fieldName === '*' || card.fieldName.charAt(0) === ':') {
              return null;
            } else {
              return {
                cardSize: card.getCurrentValue('cardSize'),
                model: card
              };
            }
          }));
          if (_.isEmpty(sizedCards)) return null;
          var computedLayout = layout.doLayout(sizedCards);
          var sortedCardSizes = _.keys(computedLayout).sort();
          var cardsInFirstSize = _.flatten(computedLayout[_.first(sortedCardSizes)]);
          return _.first(cardsInFirstSize).model.fieldName;
        });

        $scope.bindObservable('whereClause', whereClause);
        $scope.bindObservable('rowCount', rowCount.switchLatest());
        $scope.bindObservable('filteredRowCount', filteredRowCount.switchLatest());
        $scope.bindObservable('columnDetails', columnDetailsAsArray);
        $scope.bindObservable('defaultSortColumnName', defaultSortColumnName);

      }
    };

  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationTable', cardVisualizationTableDirectiveFactory);

})();
