angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions) {

  return {
    restrict: 'E',
    scope: { 'model': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');

      var columns = dataset.pluckSwitch('columns');
      var column = model.pluck('fieldName').combineLatest(columns, function(fieldName, columns) {
        return columns[fieldName];
      });

      $scope.bindObservable('fieldName', model.pluck('fieldName'));
    }
  };

});
