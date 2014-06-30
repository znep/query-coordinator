angular.module('dataCards.directives').directive('cardVisualizationTable', function(AngularRxExtensions, CardDataService) {

  return {
    restrict: 'E',
    scope: { 'model': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationTable.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');
      var rowCount = Rx.Observable.combineLatest(
          dataset,
          function(dataset) {
            return Rx.Observable.fromPromise(CardDataService.getRowCount(dataset.id));
          }).switchLatest();
      $scope.bindObservable('rowCount', rowCount);
      $scope.bindObservable('expanded', model.pluckSwitch('expanded'));
      $scope.getRows = function() {
        var args = [$scope.model.page.dataset.value.id].concat(
          Array.prototype.slice.call(arguments));
        return CardDataService.getRows.apply(null, args);
      }
    }
  };

});
