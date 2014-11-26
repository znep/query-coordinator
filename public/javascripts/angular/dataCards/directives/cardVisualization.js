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

      // TODO: Make this more efficient by not watching the entire model all the time.
      // I couldn't figure out the right combination of commands to get it to watch both
      // the fieldName and also the cardtype at the same time. Blech. --cml, 11/25/2014
      var cardType = Rx.Observable.combineLatest(
        modelSubject,
        columns,
        function(cardModel, columns) {
          var fieldName = cardModel.fieldName;
          var column = columns[fieldName];
          var overriddenCardType = cardModel.getCurrentValue('cardType');
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
