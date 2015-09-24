(function() {
  'use strict';

  function cardVisualization() {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualization.html',
      link: function($scope) {

        var model$ = $scope.$observe('model').filter(_.identity);

        $scope.$bindObservable(
          'cardType',
          Rx.Observable.combineLatest(
            model$.observeOnLatest('cardType'),
            model$.observeOnLatest('column'),
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

        $scope.$bindObservable('expanded', model$.observeOnLatest('expanded'));
        $scope.$bindObservable('cardSize', model$.observeOnLatest('cardSize'));

      }
    };

  }

  angular.
    module('socrataCommon.directives').
    directive('cardVisualization', cardVisualization);
})();
