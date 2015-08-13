(function() {
  'use strict';

  var REFRESH_BASE_LAYER_DELAY = 1000;

  function customizeCardDialog(Constants, Card, Dataset, FlyoutService, $log, I18n, CardDataService, HistogramService) {

    // Set up watchers for changing the base layer url.
    function setupBaseLayerSelect(cardModel, scope, element) {
      var baseLayer$ = cardModel.observe('baseLayerUrl');
      var customLayerUrl$ = scope.$observe('customLayerUrl');
      var baseLayerOption$;

      customLayerUrl$.subscribe(_.debounce(function(customLayerUrl) {

        // Only update it if it's valid, and the 'custom' option is chosen
        if (customLayerUrl && scope.baseLayerOption === 'custom') {
          cardModel.set('baseLayerUrl', decodeURI(customLayerUrl));
        }
      }, REFRESH_BASE_LAYER_DELAY, { leading: true, trailing: true }));

      scope.TILEURL_REGEX = Constants.TILEURL_REGEX;

      // Map the actual baseLayerUrl to the selected option
      scope.$bindObservable('baseLayerOption', baseLayer$.map(
        function(url) {
          switch (url) {
            case null:
            case undefined:
              return 'standard';
            case Constants.ESRI_BASE_URL:
              return 'esri';
            default:
              return 'custom';
          }
        }));

      // Initialize the customLayerUrl if this choropleth has one
      if (scope.baseLayerOption === 'custom') {
        scope.customLayerUrl = cardModel.getCurrentValue('baseLayerUrl');
      }

      // Map the selected option to the actual baseLayerUrl
      baseLayerOption$ = scope.$observe('baseLayerOption');
      baseLayerOption$.subscribe(function(value) {
        switch (value) {
          case 'standard':
            cardModel.unset('baseLayerUrl');
            break;
          case 'esri':
            cardModel.set('baseLayerUrl', Constants.ESRI_BASE_URL);
            break;
          case 'custom':
            if (scope.customLayerUrl) {
              cardModel.set('baseLayerUrl', decodeURI(scope.customLayerUrl));
            }

            // Focus the field on the next frame
            _.defer(function() {
              element.find('input[name="customLayerUrl"]').focus();
            });
            break;
          default:
            throw new Error('Unknown base layer option: {0}'.format(value));
        }
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
    function setupHistogramBucketTypeSelect(cardModel, scope) {
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
      scope.$bindObservable('histogramBucketOption', bucketType$.
        map(function(bucketType) {
          if (_.isDefined(bucketType)) {
            return Rx.Observable.returnValue(bucketType);
          } else {
            return determineBucketType(cardModel);
          }
        }).
        switchLatest()
      );

      // Subscribe to changes in the bucket option and set the card modal and
      // help text accordingly.
      currentBucketOption$ = scope.$observe('histogramBucketOption').filter(_.isDefined);
      currentBucketOption$.subscribe(function(bucketType) {

        // Throw an error if invalid bucket type.
        if (!_.contains(['logarithmic', 'linear'], bucketType)) {
          throw new Error('Unknown bucket type: {0}'.format(bucketType));
        }

        scope.histogramBucketHelpText = helpTextByBucketType[bucketType];
        cardModel.set('bucketType', bucketType);

        // If the bucket type hasn't changed or it has never been defined,
        // set it to the cached filters. Otherwise, clear the filters.
        cardModel.set('activeFilters', (bucketType === cachedBucketType) ? cachedFilters : []);

        // Show the bucket type warning if we had filters and we've cleared them.
        scope.showBucketTypeWarning = (_.isPresent(cachedFilters) &&
          _.isEmpty(cardModel.getCurrentValue('activeFilters')));
      });
    }

    return {
      restrict: 'E',
      scope: {
        dialogState: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/customizeCardDialog.html',
      link: function(scope, element) {

        // Clone the card, so we can cancel without having made any changes
        scope.customizedCard = scope.dialogState.cardModel.clone();
        scope.showBucketTypeWarning = false;

        scope.$bindObservable('availableCardTypes',
          scope.customizedCard.observe('column.availableCardTypes'));

        scope.$bindObservable('showBaseMapLayerDropdown',
          scope.customizedCard.observe('isCustomizableMap'));

        scope.$bindObservable('showHistogramBucketTypeDropdown',
          scope.customizedCard.observe('cardType').map(function(type) {
            return type === 'histogram';
          }));

        setupBaseLayerSelect(scope.customizedCard, scope, element);
        setupHistogramBucketTypeSelect(scope.customizedCard, scope);

         // Save the model by updating with our cloned copy.
        scope.updateCard = function() {
          scope.dialogState.cardModel.setFrom(scope.customizedCard);
          scope.dialogState.show = false;
        };

        var FLYOUT_TEMPLATE = '<div class="flyout-title">{0}</div>';
        FlyoutService.register({
          selector: '.configure-histogram-bucket-type .warning-dropdown .warning-icon',
          render: _.constant(FLYOUT_TEMPLATE.format(I18n.customizeCardDialog.histogramBucketType.warning)),
          destroySignal: scope.$destroyAsObservable(element)
        });
      }
    };
  }
  angular.
    module('dataCards.directives').
      directive('customizeCardDialog', customizeCardDialog);

})();
