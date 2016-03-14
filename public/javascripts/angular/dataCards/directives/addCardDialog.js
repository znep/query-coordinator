var templateUrl = require('angular_templates/dataCards/addCardDialog.html');
const angular = require('angular');
function addCardDialog(rx) {
  const Rx = rx;

  return {
    restrict: 'E',
    scope: {
      page: '=',
      dialogState: '='
    },
    templateUrl: templateUrl,
    link: function($scope) {

      if (!$scope.dialogState) {
        $scope.dialogState = { show: true };
      }

      /************************
      * Add new card behavior *
      ************************/

      $scope.addCardModel = null;
      $scope.addCardSelectedColumnFieldName = null;

      $scope.$on('card-model-changed', function(event, addCardModel) {
        $scope.addCardModel = addCardModel;

        // Disable the save button if the customized card is in an invalid state.
        // This behavior is duplicated in customizeCardDialog.
        // (Expand 'disableSave' as more cases come up.)
        var isRegionlessChoropleth$ = Rx.Observable.combineLatest(
          $scope.addCardModel.observe('cardType'),
          $scope.addCardModel.observe('computedColumn'),
          function(cardType, computedColumn) {
            return cardType === 'choropleth' && _.isEmpty(computedColumn);
          }
        );

        $scope.$bindObservable('disableSave', isRegionlessChoropleth$);

      });

      $scope.disableSave = true;

      $scope.addCard = function() {
        if (!_.isNull($scope.addCardModel)) {
          $scope.page.addCard($scope.addCardModel);
          $scope.dialogState.show = false;
        }
      };
    }
  };
}

angular.
  module('dataCards.directives').
    directive('addCardDialog', addCardDialog);
