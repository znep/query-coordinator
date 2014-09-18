angular.module('dataCards.directives').directive('card', function(AngularRxExtensions, $timeout, $log) {

  //TODO should probably be a service. And not suck.
  var cardTypeMapping = function(column) {
    column = column || {};
    var logicalDatatype = column.logicalDatatype;
    var physicalDatatype = column.physicalDatatype;
    if (logicalDatatype === 'category') {
      return 'column';
    }
    if (logicalDatatype === 'amount') {
      if (physicalDatatype === 'number') { return 'statBar'; }
    }
    if (logicalDatatype === 'location') {
      if (physicalDatatype === 'point') { return 'pointMap'; }
      if (physicalDatatype === 'number') { return 'choropleth'; }
      if (physicalDatatype === 'text') {
        $log.warn('Encountered location column "{0}" with text physical type - this is deprecated (expected number type).'.format(column.name));
        return 'choropleth';
      }
      if (physicalDatatype === 'geo_entity') { return 'point-ish map'; }
    }
    if (logicalDatatype === 'time') {
      if (physicalDatatype === 'timestamp') { return 'timeline'; }
      if (physicalDatatype === 'number') { return 'timeline'; }
      if (physicalDatatype === 'fixed_timestamp') { return 'timeline'; }
      if (physicalDatatype === 'floating_timestamp') { return 'timeline'; }
    }
    if (logicalDatatype === 'text' || logicalDatatype === 'name' || logicalDatatype === 'identifier') {
      if (physicalDatatype === 'text' || physicalDatatype === 'number') {
        return 'search';
      }
      if (physicalDatatype === 'fixed_timestamp') { return 'timeline'; }
      if (physicalDatatype === 'floating_timestamp') { return 'timeline'; }
    }
    if (logicalDatatype === '*') { return 'table'; }
    throw new Error('Unknown visualization for logicalDatatype: ' + logicalDatatype +
      ' and physicalDatatype: ' + physicalDatatype);
  };

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
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
        function(dimensions, descriptionText) {
          // Manually update the binding now, because Angular doesn't know that dotdotdot messes with
          // the text.
          descriptionTruncatedContent.text(descriptionText);

          var availableSpace = dimensions.height - descriptionTruncatedContent.offsetParent().position().top;

          descriptionElementsWithMaxSize.css('max-height', availableSpace);

          updateCardLayout(parseInt(descriptionTruncatedContent.css('line-height')) * 2);

        });
    }
  };

});
