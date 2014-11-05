(function() {
  'use strict';

  /**
   * Set up watchers and stuff for changing the base layer url.
   */
  function setupBaseLayerSelect(cardModel, $scope, element, Constants) {
    var baseLayerObservable = cardModel.observe('baseLayerUrl');

    $scope.$watch('customLayerUrl', _.debounce(function(val) {
      if (val) {
        cardModel.set('baseLayerUrl', val);
      }
    }, 2000));

    $scope.TILEURL_REGEX = Constants.TILEURL_REGEX;

    // Map the actual baseLayerUrl to the selected option
    $scope.bindObservable('baseLayerOption', baseLayerObservable.map(
      function(url) {
        switch(url) {
          case null:
          case undefined:
            return 'standard';
          case Constants.ESRI_BASE_URL:
            return 'esri';
          default:
            return 'custom';
        }
      }));

    // Map the selected option to the actual baseLayerUrl
    $scope.$watch('baseLayerOption', function(value) {
      switch(value) {
        case 'standard':
          cardModel.unset('baseLayerUrl');
          break;
        case 'esri':
          cardModel.set('baseLayerUrl', Constants.ESRI_BASE_URL);
          break;
        case 'custom':
          // Focus the field on the next frame
          _.defer(function() {
            element.find('input[name="customLayerUrl"]').focus();
          });
          break;
        default:
          throw Error('Unknown base layer option: ' + value);
      }
    });
  }


  function customizeCardDialog(Constants, AngularRxExtensions) {
    return {
      restrict: 'E',
      scope: {
        cardModel: '=',
        dialogState: '=?',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/customizeCardDialog.html',
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);

        // This controls whether this dialog is shown or not
        if (!$scope.dialogState) {
          $scope.dialogState = {show: true};
        }

        // Clone the card, so we can cancel without having made any changes
        $scope.customizedCard = $scope.cardModel.clone();
        setupBaseLayerSelect($scope.customizedCard, $scope, element, Constants);

        /**
         * Save the model by updating the model passed in, with our cloned copy.
         */
        $scope.updateCard = function() {
          $scope.cardModel.update($scope.customizedCard);

          // Now close the dialog
          $scope.dialogState.show = false;
        };
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('customizeCardDialog', customizeCardDialog);

})();

