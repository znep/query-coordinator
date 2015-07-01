(function() {
  'use strict';

  function addCardDialog(Constants, Card, Dataset, FlyoutService, $log, I18n) {
    return {
      restrict: 'E',
      scope: {
        page: '=',
        cardModels: '=',
        datasetColumns: '=',
        dialogState: '=',
        // A function to call to start the customize-card flow
        onCustomizeCard: '='
      },
      templateUrl: '/angular_templates/dataCards/addCardDialog.html',
      link: function(scope, element, attrs) {
        scope.$bindObservable(
          'columnHumanNameFn',
          scope.$observe('page').observeOnLatest('dataset.columns').map(
            function(datasetColumns) {
              return function(fieldName) {
                var column = datasetColumns[fieldName];
                return Dataset.extractHumanReadableColumnName(column);
              }
            }
          )
        );

        var serializedCard;

        if (!scope.dialogState) {
          scope.dialogState = { show: true };
        }

        /************************
        * Add new card behavior *
        ************************/

        scope.addCardSelectedColumnFieldName = null;
        scope.addCardModel = null;
        scope.showCardinalityWarning = false;
        scope.availableCardTypes = [];

        Rx.Observable.subscribeLatest(
          scope.$observe('addCardSelectedColumnFieldName'),
          scope.$observe('datasetColumns').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset').filter(_.isDefined),
          scope.$observe('page').observeOnLatest('dataset.columns').filter(_.isDefined),
          function(fieldName, scopeDatasetColumns, dataset, columns) {
            var columnCardinality;

            if (fieldName === null) {
              scope.addCardModel = null;
              return;
            }

            var column;

            if (_.include(scope.datasetColumns.available, fieldName)) {
              column = columns[fieldName];
            }

            if (_.isUndefined(column)) {
              $log.error('Could not get available column by fieldName.');
              scope.addCardModel = null;
              return;
            }

            scope.availableCardTypes = column.availableCardTypes;

            // TODO: Enforce some kind of schema validation at this step.
            serializedCard = {
              'cardSize': parseInt(scope.dialogState.cardSize, 10),
              'expanded': false,
              'fieldName': fieldName
            };

            serializedCard['cardType'] = column.defaultCardType;
            // TODO: We're going towards passing in serialized blobs to Model constructors.
            //Revisit this line when that effort reaches Card.
            scope.addCardModel = Card.deserialize(scope.page, serializedCard);

            if (column.hasOwnProperty('cardinality')) {
              columnCardinality = parseInt(column.cardinality, 10);
            } else {
              columnCardinality = 0;
            }

            scope.showCardinalityWarning = (columnCardinality > parseInt(Constants['COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD'], 10));
          }
        );

        scope.setCardType = function(cardType) {

          if (scope.addCardModel === null ||
              scope.availableCardTypes.indexOf(cardType) === -1) {
            $log.error('Could not set card type of "{0}".'.format(cardType));
            return;
          }

          scope.addCardModel.set('cardType', cardType);

        };

        scope.addCard = function() {
          if (scope.addCardModel !== null) {
            scope.page.addCard(scope.addCardModel);
            scope.dialogState.show = false;
          }
        };

        scope.onCustomizeCard = function(addCardModel) {
          scope.$emit('customize-card-with-model', addCardModel);
        };

        scope.$bindObservable(
          'isCustomizable',
          scope.$observe('addCardModel').observeOnLatest('isCustomizable')
        );

        FlyoutService.register({
          selector: '.add-card-type-option, .warning-icon',
          render: function(el) {
            var $el = $(el);
            var flyoutContents = null;
            var shouldShowCardinalityWarning = scope.showCardinalityWarning &&
              $el.is('.warn, .icon-warning');

            if (shouldShowCardinalityWarning) {

              flyoutContents = I18n.addCardDialog.columnChartWarning;

            } else {
              var visualizationName = el.getAttribute('data-visualization-name');

              if (visualizationName === null) {
                return;
              }

              flyoutContents = I18n.t('addCardDialog.visualizeFlyout', visualizationName);
            }

            return '<div class="flyout-title">{0}</div>'.format(flyoutContents);
          },
          positionOn: function(target) {
            var $target = $(target);

            if ($target.hasClass('icon-warning')) {
              return $target.parent()[0];
            }

            return target;
          },
          destroySignal: scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('addCardDialog', addCardDialog);

})();
