angular.module('dataCards.directives').directive('cardVisualization', function(AngularRxExtensions, CardTypeMapping) {

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

      $scope.bindObservable('cardType', modelSubject.observeOnLatest('cardType').map(function(cardType) {
        return CardTypeMapping.visualizationSupported(cardType) ? cardType : 'invalid';
      }));
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

    }
  };

});
