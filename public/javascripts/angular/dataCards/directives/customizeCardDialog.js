(function() {
  'use strict';

  function customizeCardDialog(FlyoutService) {
    return {
      restrict: 'E',
      scope: {
        cardModel: '=',
        cardModels: '=',
        dialogState: '=?',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/customizeCardDialog.html',
      link: function($scope, element, attrs) {
        if (!$scope.dialogState) {
          $scope.dialogState = {show: true};
        }
        // An array of types of fields that are configurable, and their titles
        $scope.configurableFields = [
          {name: "Map base layer", type: "baselayer", value: null}
        ];

        /**
         * Save the model by adding it if it doesn't exist, or updating it if it does.
         */
        $scope.addOrUpdate = function() {
          var uniqueId = $scope.cardModel.uniqueId;
          var existingModelIndex = _.findIndex($scope.cardModels, function(model) {
            return model.uniqueId === uniqueId;
          });
          if (existingModelIndex >= 0) {
            // Just update the existing model
            $scope.cardModels[existingModelIndex] = $scope.cardModel;
          } else {
            // Add the model in the right place
            var cardSize = $scope.cardModel.getCurrentValue('cardSize');
            var insertionIndex = _.findIndex($scope.cardModels, function(model) {
              return model.getCurrentValue('cardSize') > cardSize;
            });
            $scope.cardModels.splice($scope.cardModels, 0, $scope.cardModel);
          }
          // Let the page know we've changed things
          $scope.page.set('cards', $scope.cardModels);

          // Now close the dialog
          $scope.dialogState.show = false;
        };

        // Keep track of what's selected.
        _.each($scope.configurableFields, function(value, index) {
          $scope.$watch('configurableFields[' + index + '].value', function(newValue, oldValue) {
            console.log(arguments);
          });
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('customizeCardDialog', customizeCardDialog);

})();

