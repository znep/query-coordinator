(function() {

  'use strict';

  var validColumnRegex = new RegExp('^[\\d\\w_]{2}');

  function cardVisualizationTableDirectiveFactory(Constants, CardDataService, SortedTileLayout) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '=',
        'showCount': '=?',
        'firstColumn': '=?'
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationTable.html',
      link: function($scope) {
        var model = $scope.$observe('model');
        var dataset = model.observeOnLatest('page.dataset');
        var whereClause = $scope.$observe('whereClause');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var firstColumnObservable = $scope.$observe('firstColumn');
        var rowDisplayUnit$ = model.observeOnLatest('page.aggregation.unit');
        var cardsSequence = model.observeOnLatest('page.cards');
        var aggregationSequence = model.observeOnLatest('page.aggregation');

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
          return !column.hideInTable && validColumnRegex.test(fieldName);
        }

        function keepOnlyDisplayableColumns(columns) {
          return _.pick(
            _.cloneDeep(columns),
            isDisplayableColumn
          );
        }

        function addExtraAttributesToColumns(columns) {
          return _.transform(columns, function(result, column, fieldName) {
            var newColumn = Object.create(column);
            var unsortableTypes = Constants.TABLE_UNSORTABLE_PHYSICAL_DATATYPES;
            newColumn.sortable = !_.contains(unsortableTypes, column.physicalDatatype);
            // SIGH. I'd love to not do this, but we'd have to change a whole heap of table and
            // table test code to support that sort of idealism. The main issue is that table
            // expects its column information in a significant-order array.
            newColumn.fieldName = fieldName;

            result[fieldName] = newColumn;
          }, {});
        }

        var columnDetails = dataset.observeOnLatest('columns').
          map(keepOnlyDisplayableColumns).
          map(addExtraAttributesToColumns);

        var columnDetailsAsArray = columnDetails.
          map(function(columns) {
            return _(columns).chain().toArray().sortBy('position').value();
          }).
          combineLatest(
            firstColumnObservable,
            function(asArray, firstColumnFieldName) {
              if ($.isPresent(firstColumnFieldName)) {
                // Move the column specified by firstColumnFieldName to
                // the front of the columns array.
                var columnIndex = _.findIndex(asArray, function(column) {
                  return column.fieldName === firstColumnFieldName;
                });
                if (columnIndex >= 0) {
                  var column = asArray.splice(columnIndex, 1)[0];
                  asArray.splice(0, 0, column);
                }
              }
              return asArray;
            }
          );

        // Keep track of the number of requests that have been made and the number of
        // responses that have come back.
        // .scan() is necessary because the usual aggregation suspect reduce actually
        // will not execute over a sequence until it has been completed; scan is happy
        // to operate on active sequences.
        var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
        var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });

        // If the number of requests is greater than the number of responses, we have
        // a request in progress and we should display the spinner.
        $scope.$bindObservable('busy',
          Rx.Observable.combineLatest(
            dataRequestCount,
            dataResponseCount,
            function(requests, responses) {
              return requests === 0 || (requests > responses);
            }));

        var reconcileRequestPromise = function(promise) {
          dataRequests.onNext(1);
          promise.then(function() {
            dataResponses.onNext(1);
          });
        };

        var rowCount$ = dataset.
          map(function(dataset) {
            return CardDataService.getRowCount(dataset.id);
          }).
          doAction(reconcileRequestPromise).
          flatMapLatest(Rx.Observable.fromPromise);

        var filteredRowCount$ = dataset.combineLatest(
          whereClause,
          function(dataset, whereClause) {
            return CardDataService.getRowCount(dataset.id, whereClause);
          }).
          doAction(reconcileRequestPromise).
          flatMapLatest(Rx.Observable.fromPromise);

        // The default sort is on the first card in the page layout.
        var layout = new SortedTileLayout();

        var firstCardSequence = cardsSequence.combineLatest(
          columnDetails,
          function(cards, columnDetails) {
            var sizedCards = _.compact(_.map(cards, function(card) {
              // Sorting on the table card doesn't make any sense; computed and
              // system columns are not included either. Also exclude columns that
              // are unsortable, such as points.
              var unsortableTypes = Constants.TABLE_UNSORTABLE_PHYSICAL_DATATYPES;
              var columnPhysicalType = _.get(columnDetails[card.fieldName], 'physicalDatatype');
              var isUnsortable = _.contains(unsortableTypes, columnPhysicalType);
              if (card.fieldName === '*' ||
                card.fieldName.charAt(0) === ':' ||
                isUnsortable
                ) {
                return null;
              } else {
                return {
                  cardSize: card.getCurrentValue('cardSize'),
                  model: card
                };
              }
            }));

            if (_.isEmpty(sizedCards)) {
              return null;
            }

            var computedLayout = layout.doLayout(sizedCards);
            var sortedCardSizes = _.keys(computedLayout).sort();
            var cardsInFirstSize = _.flatten(computedLayout[_.first(sortedCardSizes)]);
            return _.first(cardsInFirstSize).model.fieldName;
          }
        );

        var aggregatedColumnSequence = aggregationSequence.
          filter(function(value) { return value['function'] !== 'count'; }).
          pluck('fieldName');

        var nonAggregatedColumnSequence = aggregationSequence.
          filter(function(value) { return value['function'] === 'count'; }).
          combineLatest(firstCardSequence, function(aggregation, firstCard) {
            return firstCard;
          });

        var defaultSortColumnName = Rx.Observable.merge(
          aggregatedColumnSequence,
          nonAggregatedColumnSequence
        ).distinctUntilChanged();

        Rx.Observable.subscribeLatest(
          filteredRowCount$,
          rowCount$,
          rowDisplayUnit$,
          function(filteredRowCount, rowCount, rowDisplayUnit) {
            var customTitle;
            var pluralRowDisplayUnit = filteredRowCount === 1 ?
              rowDisplayUnit :
              rowDisplayUnit.pluralize();
            if (rowCount === filteredRowCount) {
              customTitle = 'Showing all {0} {1}'.
                format(
                  rowCount,
                  pluralRowDisplayUnit
                );
            } else {
              customTitle = 'Showing {0} {1} <span class="subtitle">out of {2}</span>'.
                format(
                  $.commaify(filteredRowCount),
                  pluralRowDisplayUnit,
                  $.commaify(rowCount)
              );
            }
            $scope.model.set('customTitle', customTitle);
          });

        $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
        $scope.$bindObservable('whereClause', whereClause);
        $scope.$bindObservable('rowCount', rowCount$);
        $scope.$bindObservable('filteredRowCount', filteredRowCount$);
        $scope.$bindObservable('columnDetails', columnDetailsAsArray);
        $scope.$bindObservable('defaultSortColumnName', defaultSortColumnName);

      }
    };

  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationTable', cardVisualizationTableDirectiveFactory);

})();
