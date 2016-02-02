var templateUrl = require('angular_templates/dataCards/visualizationTypeSelector.html');
const angular = require('angular');
function visualizationTypeSelector(
  Constants,
  FlyoutService,
  $log,
  $window,
  I18n,
  CardDataService,
  ServerConfig,
  UserSessionService,
  ViewRights,
  rx) {
  const Rx = rx;

  function initializeCuratedRegionSelector($scope, cardModel$, cardType$) {
    var currentUser$ = Rx.Observable.returnValue($window.currentUser);
    var dataset$ = cardModel$.observeOnLatest('page.dataset');
    var columns$ = cardModel$.observeOnLatest('page.dataset.columns');
    var computedColumn$ = cardModel$.observeOnLatest('computedColumn');

    var regionCodingDetails$ = dataset$.map(function(dataset) {
      if (!_.includes(dataset.getCurrentValue('permissions').rights, ViewRights.WRITE)) {
        return {
          enabled: false,
          showInfoMessage: true,
          showNonComputedSection: true,
          enableNonComputedSection: false,
          nonComputedSectionTitle: I18n.addCardDialog.curatedRegionMessages.permissions
        };
      }

      if (!ServerConfig.get('enableSpatialLensRegionCoding')) {
        return {
          enabled: false,
          showInfoMessage: false,
          showNonComputedSection: false,
          enableNonComputedSection: false,
          nonComputedSectionTitle: null
        };
      }

      return {
        enabled: true,
        showInfoMessage: true,
        showNonComputedSection: true,
        enableNonComputedSection: true,
        nonComputedSectionTitle: I18n.addCardDialog.curatedRegionMessages.notYetComputed
      };
    }).share();

    var isRegionCodingEnabled$ = regionCodingDetails$.pluck('enabled');
    $scope.$bindObservable('showNonComputedSection', regionCodingDetails$.pluck('showNonComputedSection'));
    $scope.$bindObservable('enableNonComputedSection', regionCodingDetails$.pluck('enableNonComputedSection'));
    $scope.$bindObservable('nonComputedSectionTitle', regionCodingDetails$.pluck('nonComputedSectionTitle'));
    var informationMessage$ = regionCodingDetails$.pluck('showInfoMessage').filter(_.identity).combineLatest(
      currentUser$.map(UserSessionService.isAdmin),
      function(isRegionCodingEnabled, isAdmin) {
        return isAdmin ?
          I18n.addCardDialog.choroplethAdminMessage :
          I18n.addCardDialog.choroplethMessage;
      });
    $scope.$bindObservable('informationMessage', informationMessage$);

    // Only show the dropdown if the card is a choropleth.
    var isChoropleth = _.partial(_.isEqual, 'choropleth');
    var showCuratedRegionSelector$ = cardType$.map(isChoropleth);
    $scope.$bindObservable('showCuratedRegionSelector', showCuratedRegionSelector$);

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
    $scope.$bindObservable('allCuratedRegions', curatedAndExistingRegions$);

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
                region: `_${shapefileId}`
              }
            }
          });
        }

        var partitionedCuratedRegions = _.partition(curatedRegions, shouldEnableCuratedRegion);
        $scope.computedCuratedRegions = partitionedCuratedRegions[0];
        $scope.nonComputedCuratedRegions = partitionedCuratedRegions[1];

        var disableChoropleths = _.isEmpty(curatedRegions);

        $scope.hasSingleCuratedRegion = curatedRegions.length === 1;

        if (disableChoropleths) {
          $scope.showChoroplethWarning = true;
        } else {
          var defaultCuratedRegion = _.get(
            _.first($scope.computedCuratedRegions) || _.first($scope.nonComputedCuratedRegions),
           'view.id'
         );

          if (_.isPresent(computedColumn)) {
            var path = `${computedColumn}.computationStrategy.parameters.region`;
            var shapefile = _.get(columns, path);

            if (_.isUndefined(shapefile)) {
              $scope.selectedCuratedRegion = defaultCuratedRegion;
            } else {
              $scope.selectedCuratedRegion = shapefile.substring(1);
            }
          } else {
            $scope.selectedCuratedRegion = defaultCuratedRegion;
          }
        }

        $scope.$safeApply();
      }
    );

    // If the value of the dropdown changes, set it on the CardOptions.
    var selectedCuratedRegion$ = $scope.$observe('selectedCuratedRegion');

    Rx.Observable.subscribeLatest(
      columns$,
      cardModel$,
      selectedCuratedRegion$.filter(_.isPresent),
      function(columns, cardModel, selectedCuratedRegion) {
        var region = `_${selectedCuratedRegion}`;

        var computedColumn = _.findKey(columns, function(column) {
          return _.get(column, 'computationStrategy.parameters.region') === region;
        });

        if (_.isUndefined(computedColumn)) {
          computedColumn = `:@computed_region_${selectedCuratedRegion.replace('-', '_')}`;
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
    templateUrl: templateUrl,
    link: function($scope, element) {
      var cardModel$ = $scope.$observe('cardModel').filter(_.isPresent);
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
          $scope.$safeApply(function() {
            $scope.showHistogramColumnChartWarning = showHistogramColumnChartWarning;
          });
        });

      Rx.Observable.subscribeLatest(
        cardModelColumn$,
        $scope.$observe('supportedCardTypes'),
        function(column, supportedCardTypes) {
          // If $scope.supportedCardTypes is undefined, we support all card types.
          supportedCardTypes = supportedCardTypes || column.availableCardTypes;

          $scope.$safeApply(function() {
            $scope.availableCardTypes = _.intersection(column.availableCardTypes, supportedCardTypes);

            // Determine whether or not to show cardinality warning.
            $scope.cardinality = parseInt(_.get(column, 'cardinality', 0), 10);
            $scope.showCardinalityWarning = $scope.cardinality > Constants.COLUMN_CHART_CARDINALITY_WARNING_THRESHOLD;
          });
        }
      );

      initializeCuratedRegionSelector($scope, cardModel$, cardType$);

      $scope.setCardType = function(cardType, event) {
        if (_.isPresent(event) && $(event.currentTarget).hasClass('disabled')) {
          return;
        }

        if (_.isNull($scope.cardModel) || !_.contains($scope.availableCardTypes, cardType)) {
          $log.error(`Could not set card type of "${cardType}".`);
          return;
        }

        $scope.$safeApply(function() {
          $scope.cardModel.set('cardType', cardType);
        });
      };

      FlyoutService.register({
        selector: '.visualization-type',
        render: function(el) {
          var visualizationName = $(el).attr('data-visualization-name');
          var flyoutMessage = I18n.t(`addCardDialog.visualizeFlyout.${visualizationName}`);

          if ($scope.showCardinalityWarning && $(el).hasClass('icon-bar-chart')) {
            flyoutMessage = I18n.addCardDialog.columnChartWarning;
          } else if ($scope.showHistogramColumnChartWarning && $(el).hasClass('icon-distribution')) {
            flyoutMessage = I18n.addCardDialog.histogramColumnChartWarning;
          } else if ($scope.showChoroplethWarning && $(el).hasClass('icon-region')) {
            flyoutMessage = I18n.addCardDialog.choroplethWarning;
          }

          return FLYOUT_TEMPLATE.format(flyoutMessage);
        },
        persistOnMousedown: true,
        destroySignal: $scope.$destroyAsObservable(element)
      });

      FlyoutService.register({
        selector: '.icon-bar-chart .icon-warning',
        render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.columnChartWarning)),
        positionOn: function(el) {
          return $(el).closest('.visualization-type')[0];
        },
        persistOnMousedown: true,
        destroySignal: $scope.$destroyAsObservable(element)
      });

      FlyoutService.register({
        selector: '.icon-distribution .icon-warning',
        render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.histogramColumnChartWarning)),
        positionOn: function(el) {
          return $(el).closest('.visualization-type')[0];
        },
        persistOnMousedown: true,
        destroySignal: $scope.$destroyAsObservable(element)
      });

      FlyoutService.register({
        selector: '.icon-region .icon-warning',
        render: _.constant(FLYOUT_TEMPLATE.format(I18n.addCardDialog.choroplethWarning)),
        positionOn: function(el) {
          return el.closest('.visualization-type');
        },
        persistOnMousedown: true,
        destroySignal: $scope.$destroyAsObservable(element)
      });
    }
  };
}

angular.
  module('dataCards.directives').
    directive('visualizationTypeSelector', visualizationTypeSelector);
