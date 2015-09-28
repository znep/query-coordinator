(function() {

  'use strict';

  function cardVisualizationTableDirectiveFactory(Constants, CardDataService, PluralizeService, SortedTileLayout, I18n) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '=',
        'isEmbedded': '=?',
        'firstColumn': '=?'
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationTable.html',
      link: function($scope) {
        var model = $scope.$observe('model');
        var dataset$ = model.observeOnLatest('page.dataset');
        var whereClause$ = $scope.$observe('whereClause');
        var dataRequests$ = new Rx.Subject();
        var dataResponses$ = new Rx.Subject();
        var firstColumn$ = $scope.$observe('firstColumn');
        var rowDisplayUnit$ = model.observeOnLatest('page.rowDisplayUnit');
        var cards$ = model.observeOnLatest('page.cards');
        var aggregation$ = model.observeOnLatest('page.aggregation');
        var columns$ = dataset$.observeOnLatest('columns');

        $scope.$watch('isEmbedded', function(newVal, oldVal, scope) {
          if (!angular.isDefined(newVal)) {
            scope.isEmbedded = false;
          }
        });

        $scope.showCount = !$scope.isEmbedded;

        $scope.model.set('showDescription', false);

        // TODO: Let's figure out how to functional-reactify this request as well.
        $scope.getRows = function() {
          var args = [$scope.model.page.getCurrentValue('dataset').id].concat(
            Array.prototype.slice.call(arguments));
          return CardDataService.getRows.apply(CardDataService, args);
        };

        function isUnsortableColumn(column, fieldName) {
          var datatypeIsUnsortable = _.contains(
            Constants.TABLE_UNSORTABLE_PHYSICAL_DATATYPES,
            _.get(column, 'physicalDatatype', false)
          );

          return !isDisplayableColumn(column, fieldName) || datatypeIsUnsortable;
        }

        function isDisplayableColumn(column, fieldName) {
          return !column.hideInTable &&
            !column.isSystemColumn &&
            !column.isSubcolumn &&
            fieldName !== '*';
        }

        function keepOnlyDisplayableColumns(columns) {
          return _.pick(
            _.cloneDeep(columns),
            isDisplayableColumn
          );
        }

        function addExtraAttributesToColumns(columns) {
          return _.transform(columns, function(result, column, fieldName) {
            column.sortable = !_.contains(
              Constants.TABLE_UNSORTABLE_PHYSICAL_DATATYPES,
              column.physicalDatatype
            );

            // SIGH. I'd love to not do this, but we'd have to change a whole heap of table and
            // table test code to support that sort of idealism. The main issue is that table
            // expects its column information in a significant-order array.
            column.fieldName = fieldName;

            result[fieldName] = column;
          }, {});
        }

        var columnDetails$ = columns$.map(addExtraAttributesToColumns);
        var displayableColumnDetails$ = columnDetails$.map(keepOnlyDisplayableColumns);
        var displayableColumnDetailsAsArray$ = displayableColumnDetails$.
          map(function(columns) {
            return _(columns).chain().toArray().sortBy('position').value();
          }).
          combineLatest(
            firstColumn$,
            function(asArray, firstColumnFieldName) {
              if ($.isPresent(firstColumnFieldName)) {

                // Move the column specified by firstColumnFieldName to
                // the front of the columns array.
                var columnIndex = _.findIndex(asArray, function(column) {
                  return column.fieldName === firstColumnFieldName;
                });

                if (columnIndex >= 0) {
                  var currentColumn = asArray.splice(columnIndex, 1)[0];
                  asArray.splice(0, 0, currentColumn);
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
        var dataRequestCount$ = dataRequests$.scan(0, function(acc) { return acc + 1; });
        var dataResponseCount$ = dataResponses$.scan(0, function(acc) { return acc + 1; });

        // If the number of requests is greater than the number of responses, we have
        // a request in progress and we should display the spinner.
        $scope.$bindObservable('busy',
          Rx.Observable.combineLatest(
            dataRequestCount$,
            dataResponseCount$,
            function(requests, responses) {
              return requests === 0 || (requests > responses);
            }));

        var reconcileRequestPromise = function(promise) {
          dataRequests$.onNext(1);
          promise.then(function() {
            dataResponses$.onNext(1);
          });
        };

        var rowCount$ = dataset$.
          map(function(currentDataset) {
            return CardDataService.getRowCount(currentDataset.id);
          }).
          doAction(reconcileRequestPromise).
          flatMapLatest(Rx.Observable.fromPromise);

        var filteredRowCount$ = dataset$.combineLatest(
          whereClause$,
          function(currentDataset, curWhereClause) {
            return CardDataService.getRowCount(currentDataset.id, curWhereClause);
          }).
          doAction(reconcileRequestPromise).
          flatMapLatest(Rx.Observable.fromPromise);

        // The default sort is on the first card in the page layout.
        var layout = new SortedTileLayout();

        // 'columnDetails$' and not 'displayableColumnDetails$' is used here because
        // there exist data lens pages with cards of undisplayable columns,
        // and we need to ensure that these cards are not computed as our
        // 'firstCard$'.
        var firstCard$ = cards$.combineLatest(
          columnDetails$,
          function(cards, columnDetails) {
            var sizedCards = _.compact(_.map(cards, function(card) {
              var cardDetails = columnDetails[card.fieldName];

              // Disallow sorting on table cards and computed/system/
              // unsortable/sub columns.
              if (_.isUndefined(cardDetails) ||
                isUnsortableColumn(cardDetails, card.fieldName)) {
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

        var aggregatedColumn$ = aggregation$.
          filter(function(value) { return value['function'] !== 'count'; }).
          pluck('fieldName');

        var nonAggregatedColumn$ = aggregation$.
          filter(function(value) { return value['function'] === 'count'; }).
          combineLatest(firstCard$, function(aggregation, firstCard) {
            return firstCard;
          });

        var defaultSortColumnName$ = Rx.Observable.merge(
          aggregatedColumn$,
          nonAggregatedColumn$
        ).distinctUntilChanged();

        Rx.Observable.subscribeLatest(
          filteredRowCount$,
          rowCount$,
          rowDisplayUnit$,
          function(filteredRowCount, rowCount, rowDisplayUnit) {
            var customTitle;
            var pluralRowDisplayUnit = PluralizeService.pluralize(rowDisplayUnit, filteredRowCount);
            var rowCountWithCommas = window.socrata.utils.commaify(rowCount);
            pluralRowDisplayUnit = _.escape(pluralRowDisplayUnit);
            if (rowCount === filteredRowCount) {
              customTitle = I18n.t('table.rangeLabelAll',
                rowCountWithCommas,
                pluralRowDisplayUnit
              );
            } else {
              customTitle = I18n.t('table.rangeLabelSubtitle',
                window.socrata.utils.commaify(filteredRowCount),
                pluralRowDisplayUnit,
                rowCountWithCommas
              );
            }
            if (!$scope.isEmbedded) {
              $scope.model.set('customTitle', customTitle);
            }
          });

        $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
        $scope.$bindObservable('whereClause', whereClause$);
        $scope.$bindObservable('rowCount', rowCount$);
        $scope.$bindObservable('filteredRowCount', filteredRowCount$);
        $scope.$bindObservable('columnDetails', displayableColumnDetailsAsArray$);
        $scope.$bindObservable('defaultSortColumnName', defaultSortColumnName$);

      }
    };

  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationTable', cardVisualizationTableDirectiveFactory);

})();
