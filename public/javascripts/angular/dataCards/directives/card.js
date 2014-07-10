angular.module('dataCards.directives').directive('card', function(AngularRxExtensions, $timeout) {

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
    } else if (logicalType === '*') { return 'table'; }
    throw new Error('Unknown visualization for logicalDatatype: ' + logicalType +
      ' and physicalDatatype: ' + physicalType);
  };

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '='},
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var content = element.find('div.card');
      var modelSubject = $scope.observe('model');
      var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
      var columns = datasetObservable.observeOnLatest('columns');

      var cardType = modelSubject.pluck('fieldName').combineLatest(columns,
        function(cardField, datasetFields) {
          var column = datasetFields[cardField];
          return column ? cardTypeMapping(column) : null;
        }
      );
      var column = modelSubject.pluck('fieldName').combineLatest(columns, function(fieldName, columns) {
        return columns[fieldName];
      }).filter(_.isObject);

      $scope.descriptionCollapsed = true;

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

      $scope.bindObservable('title', column.pluck('title'));
      $scope.bindObservable('description', column.pluck('description'));

      $scope.updateCardVisHeight = function() {
        $timeout(function() {
          // waits until description is filled in to determine heights
          var cardVisHeight = element.find('.card').height() - element.find('.card').find('.card-text').outerHeight(true);
          element.find('.card').find('.card-visualization').height(cardVisHeight);
        });
      };

      $scope.toggleExpanded = function() {
        $scope.model.page.toggleExpanded($scope.model);
      };

      var descriptionTruncatedContent = content.find('.description-truncated-content');
      var descriptionElementsWithMaxSize = content.find('.description-expanded-wrapper, .description-expanded-content');
      var updateClamp = _.throttle(function(height) {
          descriptionTruncatedContent.dotdotdot({
            height: height,
            tolerance: 2
          });

          var isClamped = descriptionTruncatedContent.triggerHandler('isTruncated');

          $scope.safeApply(function() {
            $scope.descriptionClamped = isClamped;
            $scope.animationsOn = true;
            $scope.updateCardVisHeight();
          });
      }, 250, { leading: true, trailing: true });

      Rx.Observable.subscribeLatest(
        content.observeDimensions(),
        column.pluck('description'),
        function(dimensions, descriptionText) {
          // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
          // the text.
          descriptionTruncatedContent.text(descriptionText);
          var availableSpace = dimensions.height - descriptionTruncatedContent.offsetParent().position().top;

          descriptionElementsWithMaxSize.
            css('max-height', availableSpace);

          updateClamp(parseInt(descriptionTruncatedContent.css('line-height')) * 2);
        });
    }
  };

});
