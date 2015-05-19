(function() {
  'use strict';

  function cardVisualization(AngularRxExtensions, ServerConfig) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualization.html',
      link: function($scope, element, attrs) {

        AngularRxExtensions.install($scope);

        var modelSubject = $scope.$observe('model').filter(_.identity);

        $scope.bindObservable(
          'cardType',
          Rx.Observable.combineLatest(
            modelSubject.observeOnLatest('cardType'),
            modelSubject.observeOnLatest('column'),
            function(cardType, column) {

              if (!column.hasOwnProperty('defaultCardType')) {
                throw new Error(
                  'Failed to assign cardType: could not find property ' +
                  'defaultCardType on column {0}'.
                  format(JSON.stringify(column))
                );
              }

              if (!column.hasOwnProperty('availableCardTypes')) {
                throw new Error(
                  'Failed to assign cardType: could not find property ' +
                  'availableCardTypes on column {0}'.
                  format(JSON.stringify(column))
                );
              }

              // If the card metadata did not include an explicit cardType,
              // the Card model will have set it to null as a default. In
              // this case, we want to fall back to the default card type.
              if (cardType === null) {
                cardType = column.defaultCardType;
              }

              return (column.availableCardTypes.indexOf(cardType) > -1) ?
                cardType :
                'invalid';

            }
          )
        );

        $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
        $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

      }
    };

  };

  angular.
    module('socrataCommon.directives').
    directive('cardVisualization', cardVisualization);
})();
