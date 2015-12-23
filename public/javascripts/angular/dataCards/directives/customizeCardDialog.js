var templateUrl = require('angular_templates/dataCards/customizeCardDialog.html');
const angular = require('angular');
var REFRESH_BASE_LAYER_DELAY = 1000;

function customizeCardDialog(
  Constants,
  Card,
  Dataset,
  FlyoutService,
  $log,
  I18n,
  CardDataService,
  HistogramService,
  DatasetColumnsService,
  ServerConfig,
  rx) {
  const Rx = rx;

  // Set up watchers for changing the base layer url.
  function setupBaseLayerSelect(cardModel, $scope, element) {
    var baseLayer$ = cardModel.observe('baseLayerUrl');
    var customLayerUrl$ = $scope.$observe('customLayerUrl');
    var baseLayerOption$;

    customLayerUrl$.subscribe(_.debounce(function(customLayerUrl) {

      // Only update it if it's valid, and the 'custom' option is chosen
      if (customLayerUrl && $scope.baseLayerOption === 'custom') {
        cardModel.set('baseLayerUrl', decodeURI(customLayerUrl));
      }
    }, REFRESH_BASE_LAYER_DELAY, { leading: true, trailing: true }));

    $scope.TILEURL_REGEX = Constants.TILEURL_REGEX;

    // Map the actual baseLayerUrl to the selected option
    $scope.$bindObservable('baseLayerOption', baseLayer$.map(
      function(url) {
        switch (url) {
          case null:
          case undefined:
          case Constants.MAPBOX_SIMPLE_BLUE_BASE_LAYER_URL:
            return 'simpleBlue';
          case Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL:
            return 'simpleGrey';
          case Constants.ESRI_BASE_LAYER_URL:
            return 'esri';
          default:
            return 'custom';
        }
      }));

    // Initialize the customLayerUrl if this choropleth has one
    if ($scope.baseLayerOption === 'custom') {
      $scope.customLayerUrl = cardModel.getCurrentValue('baseLayerUrl');
    }

    // Map the selected option to the actual baseLayerUrl
    baseLayerOption$ = $scope.$observe('baseLayerOption');
    baseLayerOption$.subscribe(function(value) {
      switch (value) {
        case 'simpleBlue':
          cardModel.set('baseLayerUrl', null);
          break;
        case 'simpleGrey':
          cardModel.set('baseLayerUrl', Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL);
          break;
        case 'esri':
          cardModel.set('baseLayerUrl', Constants.ESRI_BASE_LAYER_URL);
          break;
        case 'custom':
          if ($scope.customLayerUrl) {
            cardModel.set('baseLayerUrl', decodeURI($scope.customLayerUrl));
          }

          // Focus the field on the next frame
          _.defer(function() {
            element.find('input[name="customLayerUrl"]').focus();
          });
          break;
        default:
          throw new Error(`Unknown base layer option: ${value}`);
      }
    });
  }

  function setupFlannelTitleSelect(cardModel, scope) {
    scope.$bindObservable('columnHumanNameFn', DatasetColumnsService.getReadableColumnNameFn$(scope));

    scope.$bindObservable('titleColumnOptions', DatasetColumnsService.getSortedColumns$(scope).map(function(sortedColumns) {
      return _.pluck(sortedColumns, 'fieldName');
    }));

    // Initialize selection to the existing flannel title column.
    scope.$bindObservable('selectedFlannelTitleColumnName', cardModel.observe('cardOptions.mapFlannelTitleColumn'));

    // Process updates to selected flannel title column
    var updatedFlannelTitle$ = scope.$observe('selectedFlannelTitleColumnName');
    updatedFlannelTitle$.skip(1).subscribe(
      function(updatedFlannelTitle) {
        cardModel.setOption('mapFlannelTitleColumn', updatedFlannelTitle);
      });
  }

  // If bucket type is undefined, determine the bucket type by examining the data.
  function determineBucketType(cardModel) {
    var fieldName = cardModel.fieldName;
    var datasetId = cardModel.page.getCurrentValue('dataset').id;
    var dataPromise = CardDataService.getColumnDomain(fieldName, datasetId, null).
      then(function(domain) {
        if (_.has(domain, 'min') && _.has(domain, 'max')) {
          return HistogramService.getBucketingOptions(domain).bucketType;
        }
      }
    );

    return Rx.Observable.fromPromise(dataPromise);
  }

  // Set up watchers for changing the histogram bucketing type.
  function setupHistogramBucketTypeSelect(cardModel, $scope) {
    var currentBucketOption$;

    // Cache the filters and bucket type so that we can reapply them.
    var cachedFilters = cardModel.getCurrentValue('activeFilters');
    var cachedBucketType = cardModel.getCurrentValue('bucketType');

    var bucketType$ = cardModel.observe('bucketType');
    var helpTextByBucketType = {
      linear: I18n.customizeCardDialog.histogramBucketType.linearDesc,
      logarithmic: I18n.customizeCardDialog.histogramBucketType.logarithmicDesc
    };

    // Set the default value of the histogram bucket option.
    $scope.$bindObservable('histogramBucketOption', bucketType$.
      map(function(bucketType) {
        return _.isDefined(bucketType) ? Rx.Observable.returnValue(bucketType) :
          determineBucketType(cardModel);
      }).
      switchLatest()
    );

    // Subscribe to changes in the bucket option and set the card modal and
    // help text accordingly.
    currentBucketOption$ = $scope.$observe('histogramBucketOption').filter(_.isDefined);
    currentBucketOption$.subscribe(function(bucketType) {

      // Throw an error if invalid bucket type.
      if (!_.contains(['logarithmic', 'linear'], bucketType)) {
        throw new Error(`Unknown bucket type: ${bucketType}`);
      }

      $scope.histogramBucketHelpText = helpTextByBucketType[bucketType];
      cardModel.set('bucketType', bucketType);

      // If the bucket type hasn't changed or it has never been defined,
      // set it to the cached filters. Otherwise, clear the filters.
      cardModel.set('activeFilters', (bucketType === cachedBucketType) ? cachedFilters : []);

      // Show the bucket type warning if we had filters and we've cleared them.
      $scope.showBucketTypeWarning = (_.isPresent(cachedFilters) &&
        _.isEmpty(cardModel.getCurrentValue('activeFilters')));
    });
  }

  return {
    restrict: 'E',
    scope: {
      dialogState: '=',
      page: '='
    },
    templateUrl: templateUrl,
    link: function($scope, element) {

      // Clone the card, so we can cancel without having made any changes
      $scope.customizedCard = $scope.dialogState.cardModel.clone();
      $scope.showBucketTypeWarning = false;

      $scope.$bindObservable('availableCardTypes',
        $scope.customizedCard.observe('column.availableCardTypes'));

      $scope.$bindObservable('showBaseMapLayerDropdown',
        $scope.customizedCard.observe('isCustomizableMap'));

      $scope.$bindObservable('showHistogramBucketTypeDropdown',
        $scope.customizedCard.observe('cardType').combineLatest(
          $scope.customizedCard.observe('visualizationType'),
          function(cardType, visualizationType) {
            return cardType === 'histogram' && visualizationType === 'histogram';
          }
        )
      );

      // Set up map customization dropdowns.
      setupBaseLayerSelect($scope.customizedCard, $scope, element);

      if (ServerConfig.get('oduxEnableFeatureMapHover')) {
        $scope.$bindObservable('showFlannelTitleMenu',
          $scope.customizedCard.observe('cardType').map(function(cardType) {
            return cardType === 'feature';
          }));
        setupFlannelTitleSelect($scope.customizedCard, $scope);
      }

      // Check to make sure we are customizing histogram before setting up
      // the bucket type option.
      $scope.$observe('showHistogramBucketTypeDropdown').
        filter(_.identity).
        subscribe(function() {
          setupHistogramBucketTypeSelect($scope.customizedCard, $scope);
        });

       // Save the model by updating with our cloned copy.
      $scope.updateCard = function() {
        $scope.dialogState.cardModel.setFrom($scope.customizedCard);
        $scope.dialogState.show = false;
      };

      var FLYOUT_TEMPLATE = '<div class="flyout-title">{0}</div>';
      FlyoutService.register({
        selector: '.configure-histogram-bucket-type .warning-dropdown .warning-icon',
        render: _.constant(FLYOUT_TEMPLATE.format(I18n.customizeCardDialog.histogramBucketType.warning)),
        destroySignal: $scope.$destroyAsObservable(element)
      });
    }
  };
}
angular.
  module('dataCards.directives').
    directive('customizeCardDialog', customizeCardDialog);
