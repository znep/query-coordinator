angular.module('dataCards.directives').directive('cardVisualization', function(AngularRxExtensions, CardTypeMapping, $timeout, $log) {

  return {
    restrict: 'E',
    scope: {
      'model': '=',
      'whereClause': '='
    },
    templateUrl: '/angular_templates/dataCards/cardVisualization.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var modelSubject = $scope.observe('model').filter(_.identity);
      var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
      var columns = datasetObservable.observeOnLatest('columns');

      var cardType = modelSubject.pluck('fieldName').combineLatest(columns,
        function(cardField, datasetFields) {
          var column = datasetFields[cardField];
          return column ? CardTypeMapping.defaultVisualizationForColumn(column) : null;
        }
      );

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

    }
  };

});
