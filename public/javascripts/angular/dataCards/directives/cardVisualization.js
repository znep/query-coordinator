angular.module('dataCards.directives').directive('cardVisualization', function(AngularRxExtensions) {

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

      $scope.bindObservable(
        'cardType',
        Rx.Observable.combineLatest(
          modelSubject.observeOnLatest('cardType'),
          modelSubject.observeOnLatest('column'),
          function(cardType, column) {

            return (column.availableCardTypes.indexOf(cardType) > -1) ? cardType : 'invalid';

          }
        )
      );
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

    }
  };

});
