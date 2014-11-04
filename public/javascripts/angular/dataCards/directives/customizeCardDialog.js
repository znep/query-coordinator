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
          $scope.page.addOrUpdateCard($scope.cardModel);

          // Now close the dialog
          $scope.dialogState.show = false;
        };

        // Listen for changes on the configurable fields
        _.each($scope.configurableFields, function(value, index) {
          $scope.$watch('configurableFields[' + index + '].value', function(newValue, oldValue) {
          });
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('customizeCardDialog', customizeCardDialog);

})();

