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
    scope: { 'model': '=', 'whereClause': '=', 'editMode': '=' },
    templateUrl: '/angular_templates/dataCards/card.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var modelSubject = $scope.observe('model');
      var datasetObservable = modelSubject.pluck('page').observeOnLatest('dataset');
      var columns = datasetObservable.observeOnLatest('columns');

      var cardType = modelSubject.pluck('fieldName').combineLatest(columns,
        function(cardField, datasetFields) {
          var column = datasetFields[cardField];
          return column ? cardTypeMapping(column) : null;
        }
      );
      cardType.
        filter(function(type) {
          return _.isPresent(type);
        }).
        subscribe(function(type) {
          $scope.$emit('cardType', type);
        });

      var column = modelSubject.pluck('fieldName').combineLatest(columns, function(fieldName, columns) {
        return columns[fieldName];
      }).filter(_.isObject);

      $scope.descriptionCollapsed = true;

      $scope.bindObservable('cardType', cardType);
      $scope.bindObservable('expanded', modelSubject.observeOnLatest('expanded'));
      $scope.bindObservable('cardSize', modelSubject.observeOnLatest('cardSize'));

      $scope.bindObservable('title', column.pluck('title'));
      $scope.bindObservable('description', column.pluck('description'));

      var updateCardLayout = _.throttle(function(textHeight) {

        var updateCardVisualizationHeight = function() {
          $timeout(function() {
            // waits until description is filled in to determine heights
            var cardVisHeight = element.height() - element.find('.card-text').outerHeight(true);
            element.find('.card-visualization').height(cardVisHeight);
          });
        };

        descriptionTruncatedContent.dotdotdot({
          height: textHeight,
          tolerance: 2
        });

        var isClamped = descriptionTruncatedContent.triggerHandler('isTruncated');

        $scope.safeApply(function() {
          $scope.descriptionClamped = isClamped;
          $scope.animationsOn = true;
          updateCardVisualizationHeight();
        });

      }, 250, { leading: true, trailing: true });

      $scope.toggleExpanded = function() {
        $scope.model.page.toggleExpanded($scope.model);
      };

      var descriptionTruncatedContent = element.find('.description-truncated-content');
      var descriptionElementsWithMaxSize = element.find('.description-expanded-wrapper, .description-expanded-content');

      Rx.Observable.subscribeLatest(
        element.observeDimensions(),
        column.pluck('description'),
        function(cardSize, dimensions, descriptionText) {
          // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
          // the text.
          descriptionTruncatedContent.text(descriptionText);

          var availableSpace = dimensions.height - descriptionTruncatedContent.offsetParent().position().top;

          descriptionElementsWithMaxSize.
            css('max-height', availableSpace);

          updateCardLayout(parseInt(descriptionTruncatedContent.css('line-height')) * 2);
        });
    }
  };

});
