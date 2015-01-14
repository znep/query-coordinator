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
      var datasetObservable = modelSubject.observeOnLatest('page.dataset');
      var columns = datasetObservable.observeOnLatest('columns');

      var cardType = Rx.Observable.combineLatest(
        modelSubject.pluck('fieldName'),
        modelSubject.observeOnLatest('cardType'),
        columns,
        function(fieldName, overriddenCardType, columns) {
          var column = columns[fieldName];
          if (_.isDefined(overriddenCardType)) {
            return overriddenCardType;
          } else {
            return column ? CardTypeMapping.defaultVisualizationForColumn(column) : null;
          }
        }
      );

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

    }
  };

});
