(function() {
  'use strict';

  function visualizationTypeSelector(
    Constants,
    FlyoutService,
    $log,
    $window,
    I18n,
    CardDataService,
    ServerConfig,
    UserSessionService
  ) {

    function initializeCuratedRegionSelector(scope, cardModel$, cardType$) {
      var currentUser$ = Rx.Observable.returnValue($window.currentUser);
      var dataset$ = cardModel$.observeOnLatest('page.dataset');
      var columns$ = cardModel$.observeOnLatest('page.dataset.columns');
      var computedColumn$ = cardModel$.observeOnLatest('computedColumn');
      var datasetRowCount$ = dataset$.
        pluck('id').
        flatMapLatest(CardDataService.getRowCount.bind(CardDataService)).
        share();

      scope.showDisabledCuratedRegionSection = false;
      var regionCodingDetails$ = Rx.Observable.combineLatest(
        dataset$,
        datasetRowCount$,
        function(dataset, rowCount) {
          if (!_.includes(dataset.getCurrentValue('permissions').rights, 'write')) {
            return {
              enabled: false,
              disabledMessage: I18n.addCardDialog.disabledCuratedRegionMessage.permissions,
              showInfoMessage: true,
              showDisabledSection: true
            };
          }

          if (rowCount > Constants.CHOROPLETH_REGION_CODE_ROW_COUNT_THRESHOLD) {
            return {
              enabled: false,
              disabledMessage: I18n.addCardDialog.disabledCuratedRegionMessage.datasetTooBig,
              showDisabledSection: true
            };
          }

          if (!ServerConfig.get('enableSpatialLensRegionCoding')) {
            return {
              enabled: false,
              disabledMessage: null,
              showDisabledSection: false
            };
          }

          return {
            enabled: true,
            disabledMessage: null,
            showInfoMessage: true,
            showDisabledSection: false
          };
        }).share();

      var isRegionCodingEnabled$ = regionCodingDetails$.pluck('enabled');
      scope.$bindObservable('showDisabledCuratedRegionSection', regionCodingDetails$.pluck('showDisabledSection'));
      scope.$bindObservable('disabledCuratedRegionMessage', regionCodingDetails$.pluck('disabledMessage'));
      var informationMessage$ = regionCodingDetails$.pluck('showInfoMessage').filter(_.identity).combineLatest(
        currentUser$.map(UserSessionService.isAdmin),
        function(isRegionCodingEnabled, isAdmin) {
          return isAdmin ?
            I18n.addCardDialog.choroplethAdminMessage :
            I18n.addCardDialog.choroplethMessage;
        });
      scope.$bindObservable('informationMessage', informationMessage$);

      // Only show the dropdown if the card is a choropleth.
      var isChoropleth = _.partial(_.isEqual, 'choropleth');
      var showCuratedRegionSelector$ = cardType$.map(isChoropleth);
      scope.$bindObservable('showCuratedRegionSelector', showCuratedRegionSelector$);

      // Retrieve the list of curated regions, used to populate the dropdown.
      var curatedRegions$ = ServerConfig.get('enableSpatialLensRegionCoding') ?
        Rx.Observable.fromPromise(CardDataService.getCuratedRegions()) :
        Rx.Observable.returnValue([]);

      var curatedAndExistingRegions$ = curatedRegions$.combineLatest(
        columns$,
        function(curatedRegions, columns) {
          var existingRegions = _.chain(columns).
            filter(function(column) {
              return _.get(column, 'computationStrategy.parameters.region');
            }).
            map(function(column) {
              return {
                  name: column.name,
                  view: {
                    id: _.get(column, 'computationStrategy.parameters.region').substring(1)
                  }
              };
            }).
            value();
          var allRegions = existingRegions.concat(curatedRegions);
          return _.uniq(allRegions, 'view.id');
        }
      );

      // Bootstrap initial dropdown options and selection.
      Rx.Observable.subscribeLatest(
        curatedAndExistingRegions$,
        columns$,
        isRegionCodingEnabled$,
        computedColumn$.take(1),
        function(curatedRegions, columns, isRegionCodingEnabled, computedColumn) {
          function shouldEnableCuratedRegion(curatedRegion) {
            var shapefileId = curatedRegion.view.id;
            return _.find(columns, {
              computationStrategy: {
                parameters: {
                  region: '_{0}'.format(shapefileId)
                }
              }
            });
          }

          if (isRegionCodingEnabled) {
            scope.curatedRegions = curatedRegions;
          } else {
            var partitionedCuratedRegions = _.partition(curatedRegions, shouldEnableCuratedRegion);
            scope.curatedRegions = partitionedCuratedRegions[0];
            scope.disabledCuratedRegions = partitionedCuratedRegions[1];
            if (_.isEmpty(scope.disabledCuratedRegions)) {
              scope.disabledCuratedRegions = null;
              scope.showDisabledCuratedRegionSection = false;
            }
          }

          var disableChoropleths = _.isEmpty(scope.curatedRegions) &&
            (!scope.showDisabledCuratedRegionSection || _.isNull(scope.disabledCuratedRegions));

          scope.hasSingleCuratedRegion = _.get(scope , 'curatedRegions.length', 0) === 1;

          if (disableChoropleths) {
            scope.showChoroplethWarning = true;
          } else {
            var defaultCuratedRegion = _.get(_.first(scope.curatedRegions), 'view.id');

            if (_.isPresent(computedColumn)) {
              var path = '{0}.computationStrategy.parameters.region'.format(computedColumn);
              var shapefile = _.get(columns, path);

              if (_.isUndefined(shapefile)) {
                scope.selectedCuratedRegion = defaultCuratedRegion;
              } else {
                scope.selectedCuratedRegion = shapefile.substring(1);
              }
            } else {
              scope.selectedCuratedRegion = defaultCuratedRegion;
            }
          }
        }
      );

      // If the value of the dropdown changes, set it on the CardOptions.
      var selectedCuratedRegion$ = scope.$observe('selectedCuratedRegion');

      Rx.Observable.subscribeLatest(
        columns$,
        cardModel$,
        selectedCuratedRegion$.filter(_.isPresent),
        function(columns, cardModel, selectedCuratedRegion) {
          var region = '_{0}'.format(selectedCuratedRegion);

          var computedColumn = _.findKey(columns, function(column) {
            return _.get(column, 'computationStrategy.parameters.region') === region;
          });

          if (_.isUndefined(computedColumn)) {
            computedColumn = ':@computed_region_{0}'.format(selectedCuratedRegion.replace('-', '_'));
          }

          cardModel.set('computedColumn', computedColumn);
        });
    }

    return {
      restrict: 'E',
      scope: {
        cardModel: '=',

        // Array of card types.
        // Optional, if set will limit available card types to the given list.
        supportedCardTypes: '=?'
      },
      templateUrl: '/angular_templates/dataCards/visualizationTypeSelector.html',
      link: function(scope, element) {
        var cardModel$ = scope.$observe('cardModel').filter(_.isPresent);
        var cardModelColumn$ = cardModel$.observeOnLatest('column').filter(_.isDefined);
        var cardType$ = cardModel$.observeOnLatest('cardType');
        var FLYOUT_TEMPLATE = '<div class="flyout-title">{0}</div>';

        // Sometimes the histogram renders as a column chart. See 8.20.
        function histogramIsRenderingAsColumnChart(visualizationType, cardType) {
          return visualizationType === 'columnChart' && cardType === 'histogram';
        }

        cardModel$.observeOnLatest('visualizationType').
          withLatestFrom(cardType$, histogramIsRenderingAsColumnChart).
          subscribe(function(showHistogramColumnChartWarning) {
            scope.$safeApply(function() {
              scope.showHistogramColumnChartWarning = showHistogramColumnChartWarning;
            });
          });

        Rx.Observable.subscribeLatest(
          cardModelColumn$,
          scope.$observe('supportedCardTypes'),
          function(column, supportedCardTypes) {
            // If scope.supportedCardTypes is undefined, we support all card types.
            supportedCardTypes = supportedCardTypes || column.availableCardTypes;

            scope.$safeApply(function() {
              scope.availableCardTypes = _.intersection(column.availableCardTypes, supportedCardTypes);

              // Determine whether or not to show cardinality warning.
              scope.cardinality = parseInt(_.get(column, 'cardinality', 0), 10);
              scope.showCardinalityWarning = scope.cardinality > Constants.COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD;
            });
          }
        );

        initializeCuratedRegionSelector(scope, cardModel$, cardType$);

        scope.setCardType = function(cardType, event) {
          if (_.isPresent(event) && $(event.currentTarget).hasClass('disabled')) {
            return;
          }

          if (_.isNull(scope.cardModel) || !_.contains(scope.availableCardTypes, cardType)) {
            $log.error('Could not set card type of "{0}".'.format(cardType));
            return;
          }

          scope.$safeApply(function() {
            scope.cardModel.set('cardType', cardType);
          });
        };

        FlyoutService.register({
          selector: '.visualization-type',
          render: function(el) {
            var visualizationName = $(el).attr('data-visualization-name');
            var flyoutMessage = I18n.t('addCardDialog.visualizeFlyout.{0}'.format(visualizationName));

            if (scope.showCardinalityWarning && $(el).hasClass('icon-bar-chart')) {
              flyoutMessage = I18n.addCardDialog.columnChartWarning;
            } else if (scope.showHistogramColumnChartWarning && $(el).hasClass('icon-distribution')) {
              flyoutMessage = I18n.addCardDialog.histogramColumnChartWarning;
            } else if (scope.showChoroplethWarning && $(el).hasClass('icon-region')) {
              flyoutMessage = I18n.addCardDialog.choroplethWarning;
            }

            return FLYOUT_TEMPLATE.format(flyoutMessage);
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-bar-chart .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.columnChartWarning)),
          positionOn: function(el) {
            return $(el).closest('.visualization-type')[0];
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-distribution .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.histogramColumnChartWarning)),
          positionOn: function(el) {
            return $(el).closest('.visualization-type')[0];
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });

        FlyoutService.register({
          selector: '.icon-region .icon-warning',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.choroplethWarning)),
          positionOn: function(el) {
            return el.closest('.visualization-type');
          },
          persistOnMousedown: true,
          destroySignal: scope.$destroyAsObservable(element)
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('visualizationTypeSelector', visualizationTypeSelector);

})();
