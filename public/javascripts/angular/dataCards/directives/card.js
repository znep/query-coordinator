angular.module('dataCards.directives').directive('card', function(AngularRxExtensions) {
  return {
    restrict: 'E',
    scope: {
      'src': '='
    },
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);
      var src = $scope.observe('src');

      var cardType = src.map(function(model) {
        //TODO
        return 'unknown_type';
      });

      $scope.bindObservable('cardType', cardType);
    }
  }
});
