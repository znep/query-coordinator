var templateUrl = require('angular_templates/dataCards/visualizationTypeSelector.html');

module.exports = function visualizationTypeSelector(
  Constants,
  FlyoutService,
  $log,
  $window,
  I18n,
  CardDataService,
  SpatialLensService,
  UserSessionService,
  UserRights,
  ViewRights,
  rx) {
  const Rx = rx;

  function initializeCuratedRegionSelector($scope, cardModel$, cardType$) {
    var dataset$ = cardModel$.observeOnLatest('page.dataset');
    var columns$ = cardModel$.observeOnLatest('page.dataset.columns');
    var computedColumn$ = cardModel$.observeOnLatest('computedColumn');

    var destroy$ = $scope.$destroyAsObservable();

    var regionCodingDetails$ = dataset$.map(function(dataset) {
      var hasPermission = _.includes(dataset.getCurrentValue('permissions').rights, ViewRights.WRITE);

      return {
        showInfoMessage: hasPermission,
        showNonComputedSection: hasPermission,
        enableNonComputedSection: hasPermission,
        nonComputedSectionTitle: hasPermission ?
          I18n.addCardDialog.curatedRegionMessages.notYetComputed : null
      };
    }).share();
    $scope.$bindObservable('showNonComputedSection', regionCodingDetails$.pluck('showNonComputedSection'));
    $scope.$bindObservable('enableNonComputedSection', regionCodingDetails$.pluck('enableNonComputedSection'));
    $scope.$bindObservable('nonComputedSectionTitle', regionCodingDetails$.pluck('nonComputedSectionTitle'));
    $scope.$bindObservable('showInfoMessage', regionCodingDetails$.pluck('showInfoMessage'));

    var informationMessage$ =
      UserSessionService.hasRight$(UserRights.MANAGE_SPATIAL_LENS).
      map(
        function(canManageSpatialLens) {
          return canManageSpatialLens ?
            I18n.addCardDialog.choroplethAdminMessage :
            I18n.addCardDialog.choroplethMessage;
        }
      );
    $scope.$bindObservable('informationMessage', informationMessage$);

    // Only show the dropdown if the card is a choropleth.
    var isChoropleth = _.partial(_.isEqual, 'choropleth');
    var showCuratedRegionSelector$ = cardType$.map(isChoropleth);
    $scope.$bindObservable('showCuratedRegionSelector', showCuratedRegionSelector$);

    var allCuratedRegions$ = dataset$.flatMapLatest(SpatialLensService.getAvailableGeoregions$);
    $scope.$bindObservable('allCuratedRegions', allCuratedRegions$);

    // Bootstrap initial dropdown options and selection.
    Rx.Observable.subscribeLatest(
      dataset$,
      allCuratedRegions$,
      columns$,
      computedColumn$.take(1),
      function(dataset, curatedRegions, columns, computedColumn) {
        function shouldEnableCuratedRegion(curatedRegion) {
          return SpatialLensService.findComputedColumnForRegion(columns, curatedRegion.view.id);
        }

        var partitionedCuratedRegions = _.partition(curatedRegions, shouldEnableCuratedRegion);
        var computedCuratedRegions = partitionedCuratedRegions[0];
        var nonComputedCuratedRegions = partitionedCuratedRegions[1];

        var canWrite = _.includes(dataset.getCurrentValue('permissions').rights, ViewRights.WRITE);
        var accessibleCuratedRegions = computedCuratedRegions;
        if (canWrite) {
          accessibleCuratedRegions = accessibleCuratedRegions.concat(nonComputedCuratedRegions);
        }

        var defaultCuratedRegion = _.get(
          _.head(accessibleCuratedRegions),
         'view.id'
        );

        var selectedCuratedRegion;
        if (_.isPresent(computedColumn)) {
          var path = `${computedColumn}.computationStrategy.parameters.region`;
          var shapefile = _.get(columns, path);

          if (_.isUndefined(shapefile)) {
            selectedCuratedRegion = defaultCuratedRegion;
          } else {
            selectedCuratedRegion = shapefile.substring(1);
          }
        } else if (_.some(accessibleCuratedRegions, 'view.id', defaultCuratedRegion)) {
          selectedCuratedRegion = defaultCuratedRegion;
        }

        $scope.computedCuratedRegions = computedCuratedRegions;
        $scope.nonComputedCuratedRegions = nonComputedCuratedRegions;
        $scope.accessibleCuratedRegions = accessibleCuratedRegions;
        $scope.selectedCuratedRegion = selectedCuratedRegion;

        $scope.showMultipleRegions = accessibleCuratedRegions.length > 1;
        $scope.showSingleRegion = accessibleCuratedRegions.length === 1;
        $scope.showNoRegions = accessibleCuratedRegions.length === 0;
        $scope.showRegionDivider = computedCuratedRegions.length > 0 && nonComputedCuratedRegions.length > 0;

        $scope.$safeApply();
      }
    );

    // If the value of the dropdown changes, set it on the CardOptions.
    var selectedCuratedRegion$ = $scope.$observe('selectedCuratedRegion');

    Rx.Observable.combineLatest(
      columns$,
      cardModel$,
      selectedCuratedRegion$.filter(_.isPresent),
      cardType$,
      function(columns, cardModel, selectedCuratedRegion, cardType) {
        return {
          columns: columns,
          cardModel: cardModel,
          selectedCuratedRegion: selectedCuratedRegion,
          cardType: cardType
        };
      }
    ).
      takeUntil(destroy$).
      subscribe(function(values) {
        var columns = values.columns;
        var cardModel = values.cardModel;
        var selectedCuratedRegion = values.selectedCuratedRegion;
        var cardType = values.cardType;

        if (cardType !== 'choropleth') {
          cardModel.set('computedColumn', null);
          return;
        }

        var region = `_${selectedCuratedRegion}`;

        var computedColumn = _.findKey(columns, function(column) {
          return _.get(column, 'computationStrategy.parameters.region') === region;
        });

        if (_.isUndefined(computedColumn)) {
          computedColumn = `:@computed_region_${selectedCuratedRegion.replace('-', '_')}`;
        }

        cardModel.set('computedColumn', computedColumn);

        $scope.$emit('card-model-changed', cardModel);
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

        if (_.isNull($scope.cardModel) || !_.includes($scope.availableCardTypes, cardType)) {
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
    }
  };
};
