angular.module('dataCards.directives').directive('cardVisualizationColumnChart', function(AngularRxExtensions, CardDataService) {

  return {
    restrict: 'E',
    scope: { 'model': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationColumnChart.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');

      var unFilteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getUnFilteredData(fieldName, dataset.id));
          }).switchLatest();

      var filteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getFilteredData(fieldName, dataset.id));
          }).switchLatest();

      $scope.bindObservable('unFilteredData', unFilteredData);
      $scope.bindObservable('filteredData', filteredData);
      $scope.bindObservable('fieldName', model.pluck('fieldName'));
      $scope.bindObservable('expanded', model.pluckSwitch('expanded'));
    }
  };

});
