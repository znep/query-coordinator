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
    scope: {
      'sourceData': '=sourceData'
    },
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);
      var sourceData = $scope.observe('sourceData');
      var dataset = sourceData.pluck('page').pluckSwitch('dataset');

      var cardType = sourceData.pluck('fieldName').combineLatest(dataset.pluckSwitch('columns'),
        function(cardField, datasetFields) {
        var column = datasetFields[cardField];
        return cardTypeMapping(column);
        }
      );

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('data', sourceData.pluckSwitch('data'));
      $scope.bindObservable('filteredData', sourceData.pluckSwitch('filteredData'));
      $scope.bindObservable('fieldName', sourceData.pluck('fieldName'));
      $scope.bindObservable('expanded', sourceData.pluckSwitch('expanded'));

      $scope.toggleExpanded = function() {
        $scope.sourceData.expanded = !$scope.expanded;
      };
    }
  };

});
