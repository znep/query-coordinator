angular.module('dataCards.directives').directive('card', function(AngularRxExtensions) {

  //TODO should probably be a service. And not suck.
  var cardTypeMapping = function(column) {
    column = column || {};

    var logicalType = column.logicalDatatype;
    var physicalType = column.physicalDatatype;
    if (logicalType === 'category') {
      return 'column';
    } else if (logicalType === 'amount') {
      if (physicalType === 'number') { return 'statBar'; }
    } else if (logicalType === 'location') {
      if (physicalType === 'point') { return 'pointMap'; }
      else if (physicalType === 'text') { return 'choropleth'; }
      else if (physicalType === 'geo entity') { return 'point-ish map'; }
    } else if (logicalType === 'time') {
      if (physicalType === 'timestamp') { return 'timeline'; }
      else if (physicalType === 'number') { return 'timeline'; }
    } else if (logicalType === 'text' || logicalType === 'name' || logicalType === 'identifier') {
      if (physicalType === 'text' || physicalType === 'number') {
        return 'search';
      }
    }
    throw new Error('Unknown visualization for logicalDatatype: ' + logicalType +
      ' and physicalDatatype: ' + physicalType);
  };

  return {
    restrict: 'E',
    scope: { 'model': '=' },
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);
      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');

      var cardType = model.pluck('fieldName').combineLatest(dataset.pluckSwitch('columns'),
        function(cardField, datasetFields) {
          var column = datasetFields[cardField];
          return cardTypeMapping(column);
        }
      );

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('unfilteredData', model.pluckSwitch('unfilteredData'));
      $scope.bindObservable('filteredData', model.pluckSwitch('filteredData'));
      $scope.bindObservable('fieldName', model.pluck('fieldName'));
      $scope.bindObservable('expanded', model.pluckSwitch('expanded'));

      $scope.toggleExpanded = function() {
        // NOTE: For the MVP, we only ever allow one expanded card.
        // Enforce that here.
        _.each($scope.model.page.cards.value, function(card) {
          if (card !== $scope.model) {
            card.expanded = false;
          }
        });

        $scope.model.expanded = !$scope.expanded;// TODO Determine if IDE warning "Value assigned to primitive will be lost" is a red herring
      };
    }
  };

});
