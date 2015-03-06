angular.module('dataCards.directives').directive('cardVisualization', function(AngularRxExtensions, ServerConfig, CardTypeMapping) {

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

      if (ServerConfig.metadataMigration.shouldUseLocalCardTypeMapping()) {

        $scope.bindObservable('cardType', modelSubject.observeOnLatest('cardType').map(function(cardType) {
          return CardTypeMapping.visualizationSupported(cardType) ? cardType : 'invalid';
        }));

      } else {

        $scope.bindObservable(
          'cardType',
          Rx.Observable.combineLatest(
            modelSubject.observeOnLatest('cardType'),
            modelSubject.observeOnLatest('column'),
            function(cardType, column) {

              if (!column.hasOwnProperty('availableCardTypes')) {
                throw new Error(
                  'Failed to assign cardType: could not find property availableCardTypes on column {0}'.
                  format(JSON.stringify(column))
                );
              }

              return (column.availableCardTypes.indexOf(cardType) > -1) ? cardType : 'invalid';

            }
          )
        );

      }

      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

    }
  };

});
